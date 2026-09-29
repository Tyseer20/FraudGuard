from __future__ import annotations

import io
from typing import Any

import numpy as np
import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer

from ..services.model_service import (
    ModelNotReadyError,
    get_model_service,
)


router = APIRouter(
    prefix="/api/csv",
    tags=["CSV Analysis"],
)


MAX_FILE_SIZE_MB = 1024  # Allow CSV files up to 1 GB
MAX_ROWS = 5_000_000     # Allow up to 5 million rows
PREVIEW_LIMIT = 100
SUSPICIOUS_LIMIT = 500


CREDIT_CARD_FEATURES = [
    "Time",
    *[f"V{i}" for i in range(1, 29)],
    "Amount",
]


LABEL_CANDIDATES = {
    "class",
    "fraud",
    "isfraud",
    "is_fraud",
    "fraudulent",
    "label",
    "target",
}


def _normalize_column(value: str) -> str:
    return (
        str(value)
        .strip()
        .lower()
        .replace(" ", "")
        .replace("-", "")
        .replace("_", "")
    )


def _find_label_column(
    columns: list[str],
) -> str | None:
    normalized = {
        _normalize_column(column): column
        for column in columns
    }

    for candidate in LABEL_CANDIDATES:
        if candidate in normalized:
            return normalized[candidate]

    return None


def _find_credit_card_columns(
    columns: list[str],
) -> dict[str, str]:
    normalized = {
        _normalize_column(column): column
        for column in columns
    }

    mapping: dict[str, str] = {}

    for expected in CREDIT_CARD_FEATURES:
        normalized_expected = _normalize_column(
            expected
        )

        actual = normalized.get(
            normalized_expected
        )

        if actual is None:
            return {}

        mapping[expected] = actual

    return mapping


def _as_binary_label(value: Any) -> int | None:
    if pd.isna(value):
        return None

    if isinstance(value, (bool, np.bool_)):
        return int(value)

    if isinstance(
        value,
        (int, float, np.integer, np.floating),
    ):
        numeric = float(value)

        if numeric in (0.0, 1.0):
            return int(numeric)

    text = str(value).strip().lower()

    if text in {
        "1",
        "true",
        "yes",
        "fraud",
        "fraudulent",
        "fraudster",
        "anomaly",
    }:
        return 1

    if text in {
        "0",
        "false",
        "no",
        "legitimate",
        "normal",
        "valid",
        "genuine",
    }:
        return 0

    return None


def _risk_from_probability(
    probability: float,
) -> tuple[str, str]:
    if probability >= 0.90:
        return "Critical", "BLOCK"

    if probability >= 0.70:
        return "High", "BLOCK"

    if probability >= 0.40:
        return "Medium", "REVIEW"

    return "Low", "APPROVE"


def _clean_numeric_frame(
    frame: pd.DataFrame,
) -> tuple[pd.DataFrame, list[str]]:
    numeric = frame.select_dtypes(
        include=["number"]
    ).copy()

    numeric = numeric.replace(
        [np.inf, -np.inf],
        np.nan,
    )

    numeric = numeric.dropna(
        axis=1,
        how="all",
    )

    columns = list(numeric.columns)

    if not columns:
        raise HTTPException(
            status_code=422,
            detail=(
                "The CSV does not contain usable "
                "numeric columns for anomaly analysis."
            ),
        )

    imputer = SimpleImputer(
        strategy="median"
    )

    values = imputer.fit_transform(numeric)

    cleaned = pd.DataFrame(
        values,
        columns=columns,
        index=frame.index,
    )

    return cleaned, columns


def _analyze_compatible_dataset(
    df: pd.DataFrame,
    feature_map: dict[str, str],
    label_column: str | None,
) -> dict[str, Any]:
    service = get_model_service()

    try:
        service.load()
    except ModelNotReadyError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    feature_columns = [
        feature_map[name]
        for name in CREDIT_CARD_FEATURES
    ]

    working = df[
        feature_columns
    ].copy()

    for column in feature_columns:
        working[column] = pd.to_numeric(
            working[column],
            errors="coerce",
        )

    working = working.replace(
        [np.inf, -np.inf],
        np.nan,
    )

    # Missing values are filled using the
    # median of each feature in the uploaded file.
    for column in feature_columns:
        median = working[column].median()

        if pd.isna(median):
            median = 0.0

        working[column] = working[
            column
        ].fillna(median)

    results: list[dict[str, Any]] = []

    for row_number, (_, row) in enumerate(
        working.iterrows(),
        start=1,
    ):
        features = {
            expected_name: float(
                row[actual_name]
            )
            for expected_name, actual_name in feature_map.items()
        }

        prediction = service.predict(
            features
        )

        actual_label = None

        if label_column is not None:
            actual_label = _as_binary_label(
                df.iloc[
                    row_number - 1
                ][label_column]
            )

        results.append(
            {
                "row": row_number,
                "prediction": int(
                    prediction["prediction"]
                ),
                "is_fraud": bool(
                    prediction["is_fraud"]
                ),
                "fraud_probability": round(
                    float(
                        prediction[
                            "fraud_probability"
                        ]
                    ),
                    6,
                ),
                "fraud_score_percent": round(
                    float(
                        prediction[
                            "fraud_score_percent"
                        ]
                    ),
                    2,
                ),
                "risk": str(
                    prediction["risk"]
                ),
                "decision": str(
                    prediction["decision"]
                ),
                "model": str(
                    prediction["model"]
                ),
                "actual_label": actual_label,
            }
        )

    return {
        "mode": "supervised_ensemble",
        "model": "Ensemble",
        "feature_space": CREDIT_CARD_FEATURES,
        "label_column": label_column,
        "results": results,
    }


def _analyze_generic_dataset(
    df: pd.DataFrame,
    label_column: str | None,
) -> dict[str, Any]:
    numeric, numeric_columns = (
        _clean_numeric_frame(df)
    )

    if len(numeric_columns) == 0:
        raise HTTPException(
            status_code=422,
            detail=(
                "No usable numeric transaction "
                "features were found."
            ),
        )

    contamination = min(
        max(0.01, 20 / max(len(df), 20)),
        0.10,
    )

    detector = IsolationForest(
        n_estimators=300,
        contamination=contamination,
        random_state=42,
        n_jobs=-1,
    )

    anomaly_labels = detector.fit_predict(
        numeric.values
    )

    raw_scores = -detector.decision_function(
        numeric.values
    )

    minimum = float(
        np.min(raw_scores)
    )
    maximum = float(
        np.max(raw_scores)
    )

    if maximum > minimum:
        normalized_scores = (
            raw_scores - minimum
        ) / (maximum - minimum)
    else:
        normalized_scores = np.zeros(
            len(raw_scores)
        )

    results: list[dict[str, Any]] = []

    for index, (
        anomaly_label,
        anomaly_score,
    ) in enumerate(
        zip(
            anomaly_labels,
            normalized_scores,
        )
    ):
        suspicious = (
            int(anomaly_label) == -1
        )

        score = float(anomaly_score)

        if score >= 0.85:
            risk = "Critical"
            decision = "BLOCK"

        elif score >= 0.65:
            risk = "High"
            decision = "REVIEW"

        elif score >= 0.40:
            risk = "Medium"
            decision = "REVIEW"

        else:
            risk = "Low"
            decision = "APPROVE"

        actual_label = None

        if label_column is not None:
            actual_label = _as_binary_label(
                df.iloc[index][label_column]
            )

        results.append(
            {
                "row": index + 1,
                "prediction": int(
                    suspicious
                ),
                "is_fraud": suspicious,
                "fraud_probability": round(
                    score,
                    6,
                ),
                "fraud_score_percent": round(
                    score * 100,
                    2,
                ),
                "risk": risk,
                "decision": decision,
                "model": "Isolation Forest",
                "actual_label": actual_label,
            }
        )

    return {
        "mode": "generic_anomaly_detection",
        "model": "Isolation Forest",
        "feature_space": numeric_columns,
        "label_column": label_column,
        "results": results,
    }


@router.post("/analyze")
async def analyze_csv(
    file: UploadFile = File(...),
) -> dict[str, Any]:
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No CSV file was supplied.",
        )

    if not file.filename.lower().endswith(
        ".csv"
    ):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported.",
        )

    raw = await file.read()

    size_mb = len(raw) / (
        1024 * 1024
    )

    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=(
                f"CSV file is too large. "
                f"Maximum allowed size is "
                f"{MAX_FILE_SIZE_MB} MB."
            ),
        )

    if not raw.strip():
        raise HTTPException(
            status_code=400,
            detail="The uploaded CSV is empty.",
        )

    try:
        df = pd.read_csv(
            io.BytesIO(raw)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Could not read CSV file: {exc}"
            ),
        ) from exc

    if df.empty:
        raise HTTPException(
            status_code=422,
            detail="The uploaded CSV contains no rows.",
        )

    if len(df) > MAX_ROWS:
        raise HTTPException(
            status_code=413,
            detail=(
                f"The CSV contains {len(df):,} rows. "
                f"Maximum allowed is {MAX_ROWS:,} rows."
            ),
        )

    df.columns = [
        str(column).strip()
        for column in df.columns
    ]

    label_column = _find_label_column(
        list(df.columns)
    )

    feature_map = (
        _find_credit_card_columns(
            list(df.columns)
        )
    )

    try:
        if feature_map:
            analysis = _analyze_compatible_dataset(
                df,
                feature_map,
                label_column,
            )
        else:
            analysis = _analyze_generic_dataset(
                df,
                label_column,
            )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"CSV analysis failed: {exc}"
            ),
        ) from exc

    results = analysis["results"]

    total = len(results)
    suspicious = sum(
        1
        for item in results
        if item["is_fraud"]
    )

    blocked = sum(
        1
        for item in results
        if item["decision"] == "BLOCK"
    )

    review = sum(
        1
        for item in results
        if item["decision"] == "REVIEW"
    )

    approved = sum(
        1
        for item in results
        if item["decision"] == "APPROVE"
    )

    actual_labeled = [
        item
        for item in results
        if item["actual_label"] is not None
    ]

    evaluation: dict[str, Any] | None = None

    if actual_labeled:
        actual = np.array(
            [
                item["actual_label"]
                for item in actual_labeled
            ],
            dtype=int,
        )

        predicted = np.array(
            [
                int(item["is_fraud"])
                for item in actual_labeled
            ],
            dtype=int,
        )

        tp = int(
            np.sum(
                (actual == 1)
                & (predicted == 1)
            )
        )

        tn = int(
            np.sum(
                (actual == 0)
                & (predicted == 0)
            )
        )

        fp = int(
            np.sum(
                (actual == 0)
                & (predicted == 1)
            )
        )

        fn = int(
            np.sum(
                (actual == 1)
                & (predicted == 0)
            )
        )

        precision = (
            tp / (tp + fp)
            if tp + fp
            else 0.0
        )

        recall = (
            tp / (tp + fn)
            if tp + fn
            else 0.0
        )

        f1 = (
            2
            * precision
            * recall
            / (precision + recall)
            if precision + recall
            else 0.0
        )

        accuracy = (
            (tp + tn)
            / len(actual)
            if len(actual)
            else 0.0
        )

        evaluation = {
            "labeled_rows": len(
                actual_labeled
            ),
            "accuracy": round(
                accuracy,
                4,
            ),
            "precision": round(
                precision,
                4,
            ),
            "recall": round(
                recall,
                4,
            ),
            "f1": round(
                f1,
                4,
            ),
            "true_positive": tp,
            "true_negative": tn,
            "false_positive": fp,
            "false_negative": fn,
        }

    suspicious_rows = [
        item
        for item in results
        if item["is_fraud"]
    ]

    suspicious_rows = sorted(
        suspicious_rows,
        key=lambda item: item[
            "fraud_probability"
        ],
        reverse=True,
    )[:SUSPICIOUS_LIMIT]

    preview = results[
        :PREVIEW_LIMIT
    ]

    return {
        "filename": file.filename,
        "rows": total,
        "columns": [
            str(column)
            for column in df.columns
        ],
        "column_count": len(
            df.columns
        ),
        "mode": analysis["mode"],
        "model": analysis["model"],
        "feature_space": analysis[
            "feature_space"
        ],
        "label_column": label_column,
        "summary": {
            "total": total,
            "suspicious": suspicious,
            "suspicious_rate": round(
                (
                    suspicious / total * 100
                )
                if total
                else 0.0,
                2,
            ),
            "blocked": blocked,
            "review": review,
            "approved": approved,
        },
        "evaluation": evaluation,
        "suspicious_transactions": (
            suspicious_rows
        ),
        "preview": preview,
    }