from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


class ModelNotReadyError(RuntimeError):
    pass


class ModelService:
    """Loads the trained fraud models and exposes inference-friendly methods."""

    def __init__(self) -> None:
        project_root = Path(__file__).resolve().parents[3]
        self.model_dir = project_root / "ml" / "models"
        self.data_path = project_root / "ml" / "data" / "raw" / "creditcard.csv"
        self.metrics_path = self.model_dir / "metrics.json"
        self.manifest_path = self.model_dir / "manifest.json"
        self.model_paths = {
            "Logistic Regression": self.model_dir / "logistic_regression.joblib",
            "Random Forest": self.model_dir / "random_forest.joblib",
            "XGBoost": self.model_dir / "xgboost.joblib",
            "Ensemble": self.model_dir / "ensemble.joblib",
        }
        self._models: dict[str, Any] = {}
        self._metrics: dict[str, Any] | None = None
        self._manifest: dict[str, Any] | None = None

    def _ensure_artifacts(self) -> None:
        missing = [p for p in (*self.model_paths.values(), self.metrics_path, self.manifest_path) if not p.exists()]
        if missing:
            joined = ", ".join(str(p) for p in missing)
            raise ModelNotReadyError(f"Model artifacts are missing: {joined}")

    def load(self) -> None:
        self._ensure_artifacts()
        for name, path in self.model_paths.items():
            if name not in self._models:
                self._models[name] = joblib.load(path)
        if self._metrics is None:
            self._metrics = json.loads(self.metrics_path.read_text(encoding="utf-8"))
        if self._manifest is None:
            self._manifest = json.loads(self.manifest_path.read_text(encoding="utf-8"))

    @property
    def metrics(self) -> dict[str, Any]:
        self.load()
        assert self._metrics is not None
        return self._metrics

    @property
    def manifest(self) -> dict[str, Any]:
        self.load()
        assert self._manifest is not None
        return self._manifest

    def _validate_features(self, features: dict[str, float]) -> list[str]:
        expected = self.manifest["features"]
        missing = [name for name in expected if name not in features]
        extra = [name for name in features if name not in expected]
        if missing:
            raise ValueError(f"Missing features: {missing}")
        if extra:
            raise ValueError(f"Unexpected features: {extra}")
        return expected

    @staticmethod
    def _risk(probability: float) -> str:
        if probability >= 0.75:
            return "Critical"
        if probability >= 0.50:
            return "High"
        if probability >= 0.25:
            return "Medium"
        return "Low"

    def predict(self, features: dict[str, float]) -> dict[str, Any]:
        self.load()
        expected = self._validate_features(features)
        frame = pd.DataFrame([[float(features[name]) for name in expected]], columns=expected)

        model_results: dict[str, float] = {}
        for name, model in self._models.items():
            model_results[name] = float(model.predict_proba(frame)[0][1])

        ensemble_probability = model_results["Ensemble"]
        prediction = int(self._models["Ensemble"].predict(frame)[0])
        return {
            "prediction": prediction,
            "is_fraud": bool(prediction == 1),
            "fraud_probability": ensemble_probability,
            "fraud_score_percent": round(ensemble_probability * 100, 2),
            "risk": self._risk(ensemble_probability),
            "decision": "BLOCK" if ensemble_probability >= 0.75 else "REVIEW" if ensemble_probability >= 0.50 else "APPROVE",
            "model": "Ensemble",
            "model_probabilities": {
                name: round(probability * 100, 2) for name, probability in model_results.items()
            },
        }

    def sample(self, fraud: bool) -> dict[str, Any]:
        """Return one real dataset row for an interactive demonstration."""
        if not self.data_path.exists():
            raise ModelNotReadyError(f"Dataset not found: {self.data_path}")
        df = pd.read_csv(self.data_path)
        target = 1 if fraud else 0
        matches = df[df["Class"] == target]
        if matches.empty:
            raise ModelNotReadyError(f"No {'fraud' if fraud else 'legitimate'} sample exists in the dataset")
        row = matches.iloc[len(matches) // 2]
        features = {name: float(row[name]) for name in self.manifest["features"]}
        return {
            "source": "creditcard.csv demo sample",
            "features": features,
            "known_label": int(row["Class"]),
        }


@lru_cache(maxsize=1)
def get_model_service() -> ModelService:
    return ModelService()
