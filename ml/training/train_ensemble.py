"""Train and evaluate individual + ensemble fraud models.

Usage (from the FraudGuard project root):
    python ml/training/train_ensemble.py --csv ml/data/raw/creditcard.csv

The script writes reusable model artifacts and research-ready metrics to:
    ml/models/
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

RANDOM_STATE = 42


def build_preprocessor(columns: list[str], scale: bool) -> ColumnTransformer:
    steps = [("imputer", SimpleImputer(strategy="median"))]
    if scale:
        steps.append(("scaler", StandardScaler()))
    return ColumnTransformer(
        [("numeric", Pipeline(steps), columns)],
        remainder="drop",
    )


def metric_row(name: str, y_true: pd.Series, y_pred: np.ndarray, y_prob: np.ndarray, seconds: float) -> dict:
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    return {
        "model": name,
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_prob)),
        "pr_auc": float(average_precision_score(y_true, y_prob)),
        "true_negative": int(tn),
        "false_positive": int(fp),
        "false_negative": int(fn),
        "true_positive": int(tp),
        "training_seconds": round(seconds, 3),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train FraudGuard's fraud-detection models")
    parser.add_argument("--csv", required=True, help="Path to creditcard.csv")
    parser.add_argument("--target", default="Class", help="Binary fraud target column")
    args = parser.parse_args()

    csv_path = Path(args.csv).resolve()
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset not found: {csv_path}")

    print(f"Loading dataset: {csv_path}")
    df = pd.read_csv(csv_path)
    if args.target not in df.columns:
        raise ValueError(f"Target column '{args.target}' not found. Columns: {list(df.columns)}")

    df = df.replace([np.inf, -np.inf], np.nan)
    X = df.drop(columns=[args.target])
    y = pd.to_numeric(df[args.target], errors="raise").astype(int)

    if set(y.unique()) - {0, 1}:
        raise ValueError("This script expects a binary target encoded as 0/1.")

    numeric_cols = X.select_dtypes(include=["number"]).columns.tolist()
    if len(numeric_cols) != X.shape[1]:
        raise ValueError("All features should be numeric for this dataset pipeline.")

    print(f"Rows: {len(df):,}")
    print(f"Features: {len(numeric_cols)}")
    print(f"Fraud rows: {int(y.sum()):,}")
    print(f"Fraud rate: {y.mean():.4%}")

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        stratify=y,
        random_state=RANDOM_STATE,
    )

    # Class weights are deliberately used instead of naive oversampling so the
    # first experiment remains reproducible and avoids synthetic samples.
    lr = Pipeline([
        ("pre", build_preprocessor(numeric_cols, scale=True)),
        ("model", LogisticRegression(
            max_iter=2000,
            class_weight="balanced",
            solver="liblinear",
            random_state=RANDOM_STATE,
        )),
    ])

    rf = Pipeline([
        ("pre", build_preprocessor(numeric_cols, scale=False)),
        ("model", RandomForestClassifier(
            n_estimators=250,
            max_depth=None,
            min_samples_leaf=1,
            class_weight="balanced_subsample",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )),
    ])

    # scale_pos_weight gives the boosting model an explicit view of the rare
    # positive class without leaking test-set information.
    neg, pos = np.bincount(y_train)
    scale_pos_weight = float(neg / max(pos, 1))
    xgb = Pipeline([
        ("pre", build_preprocessor(numeric_cols, scale=False)),
        ("model", XGBClassifier(
            n_estimators=300,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="binary:logistic",
            eval_metric="logloss",
            scale_pos_weight=scale_pos_weight,
            tree_method="hist",
            random_state=RANDOM_STATE,
            n_jobs=4,
        )),
    ])

    base = [("lr", lr), ("rf", rf), ("xgb", xgb)]
    ensemble = VotingClassifier(
        estimators=base,
        voting="soft",
        weights=[1, 2, 2],
        n_jobs=-1,
    )

    models = {
        "Logistic Regression": lr,
        "Random Forest": rf,
        "XGBoost": xgb,
        "Ensemble": ensemble,
    }

    results: list[dict] = []
    out_dir = Path(__file__).resolve().parents[1] / "models"
    out_dir.mkdir(parents=True, exist_ok=True)

    for display_name, model in models.items():
        print(f"\nTraining {display_name}...")
        started = time.perf_counter()
        model.fit(X_train, y_train)
        elapsed = time.perf_counter() - started

        prediction = model.predict(X_test)
        probability = model.predict_proba(X_test)[:, 1]
        row = metric_row(display_name, y_test, prediction, probability, elapsed)
        results.append(row)
        print(json.dumps(row, indent=2))

        artifact_name = {
            "Logistic Regression": "logistic_regression.joblib",
            "Random Forest": "random_forest.joblib",
            "XGBoost": "xgboost.joblib",
            "Ensemble": "ensemble.joblib",
        }[display_name]
        joblib.dump(model, out_dir / artifact_name)

    metrics = {
        "dataset": csv_path.name,
        "target": args.target,
        "random_state": RANDOM_STATE,
        "rows": int(len(df)),
        "features": numeric_cols,
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "fraud_rows": int(y.sum()),
        "fraud_rate": float(y.mean()),
        "models": results,
        "best_accuracy_model": max(results, key=lambda x: x["accuracy"])["model"],
        "best_f1_model": max(results, key=lambda x: x["f1"])["model"],
        "best_recall_model": max(results, key=lambda x: x["recall"])["model"],
    }

    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    pd.DataFrame(results).to_csv(out_dir / "model_comparison.csv", index=False)

    manifest = {
        "ensemble_artifact": str(out_dir / "ensemble.joblib"),
        "metrics_artifact": str(out_dir / "metrics.json"),
        "feature_count": len(numeric_cols),
        "features": numeric_cols,
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print("\nTraining complete.")
    print(f"Artifacts: {out_dir}")
    print("Research metrics saved to metrics.json and model_comparison.csv")


if __name__ == "__main__":
    main()
