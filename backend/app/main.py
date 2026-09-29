from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import desc, func, or_, select
from sqlalchemy.orm import Session

from .api.csv_analyzer import router as csv_analyzer_router
from .core.config import settings
from .db import get_db, init_db
from .models_db import AlertRecord, TransactionRecord
from .services.kafka_service import get_kafka_service
from .services.model_service import ModelNotReadyError, get_model_service


app = FastAPI(
    title="FraudGuard API",
    version="0.4.0",
    description=(
        "Fraud detection, inference, SQL persistence, "
        "and real-time Kafka pipeline API"
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(csv_analyzer_router)


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str


class PredictionRequest(BaseModel):
    features: dict[str, float] = Field(
        ...,
        description="Feature values using the dataset feature names",
    )
    source: str = Field(default="api", max_length=32)
    known_label: int | None = Field(default=None, ge=0, le=1)


def _transaction_out(
    record: TransactionRecord,
) -> dict[str, Any]:
    features = json.loads(record.features_json)
    model_probabilities = json.loads(
        record.model_probabilities_json
    )

    return {
        "id": record.id,
        "created_at": (
            record.created_at.isoformat()
            if record.created_at
            else None
        ),
        "amount": round(record.amount, 2),
        "fraud_probability": round(
            record.fraud_probability,
            6,
        ),
        "fraud_score_percent": round(
            record.fraud_score_percent,
            2,
        ),
        "risk": record.risk,
        "decision": record.decision,
        "is_fraud": record.is_fraud,
        "model": record.model,
        "source": record.source,
        "known_label": record.known_label,
        "features": features,
        "model_probabilities": model_probabilities,
    }


def _persist_prediction(
    db: Session,
    payload: PredictionRequest,
    prediction: dict[str, Any],
) -> TransactionRecord:
    transaction_id = uuid.uuid4().hex[:12].upper()
    created_at = datetime.now(timezone.utc)

    amount = float(
        payload.features.get(
            "Amount",
            0.0,
        )
    )

    record = TransactionRecord(
        id=transaction_id,
        created_at=created_at,
        amount=amount,
        fraud_probability=float(
            prediction["fraud_probability"]
        ),
        fraud_score_percent=float(
            prediction["fraud_score_percent"]
        ),
        risk=str(prediction["risk"]),
        decision=str(prediction["decision"]),
        is_fraud=bool(prediction["is_fraud"]),
        model=str(prediction["model"]),
        source=payload.source,
        known_label=payload.known_label,
        features_json=json.dumps(
            payload.features
        ),
        model_probabilities_json=json.dumps(
            prediction["model_probabilities"]
        ),
    )

    db.add(record)

    if record.risk in {
        "High",
        "Critical",
    }:
        alert = AlertRecord(
            id=uuid.uuid4().hex[:12].upper(),
            transaction_id=transaction_id,
            created_at=created_at,
            level=record.risk,
            title="High-risk transaction detected",
            detail=(
                f"Transaction {transaction_id} scored "
                f"{record.fraud_score_percent:.2f}% "
                "fraud probability."
            ),
            status="Open",
        )

        db.add(alert)

    db.commit()
    db.refresh(record)

    return record


def _publish_transaction_event(
    payload: PredictionRequest,
    prediction: dict[str, Any],
    record: TransactionRecord,
) -> bool:
    """
    Publish a completed FraudGuard prediction to Kafka.

    Kafka publishing is intentionally separated from SQL persistence.
    If Kafka is temporarily unavailable, the prediction remains
    successfully persisted in SQL and the API can still return
    the ML result.
    """

    event = {
        "event_type": "fraud_prediction",
        "event_version": 1,
        "transaction_id": record.id,
        "created_at": (
            record.created_at.isoformat()
            if record.created_at
            else datetime.now(timezone.utc).isoformat()
        ),
        "source": payload.source,
        "known_label": payload.known_label,
        "features": payload.features,
        "prediction": {
            "prediction": int(
                prediction["prediction"]
            ),
            "is_fraud": bool(
                prediction["is_fraud"]
            ),
            "fraud_probability": float(
                prediction["fraud_probability"]
            ),
            "fraud_score_percent": float(
                prediction["fraud_score_percent"]
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
            "model_probabilities": prediction[
                "model_probabilities"
            ],
        },
    }

    try:
        kafka = get_kafka_service()
        kafka.publish_transaction(event)
        return True

    except Exception as exc:
        # Kafka failure should not erase an already-successful
        # ML prediction and SQL transaction.
        print(
            f"Kafka publish failed: {exc}"
        )
        return False


@app.on_event("startup")
def startup() -> None:
    init_db()

    # Initialize the Kafka producer when FastAPI starts.
    # This does not prevent the API from starting if Kafka is unavailable.
    try:
        get_kafka_service()
        print("Kafka producer initialized.")

    except Exception as exc:
        print(
            "Kafka producer initialization failed: "
            f"{exc}"
        )


@app.get(
    "/api/health",
    response_model=HealthResponse,
)
def health() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        service="fraudguard-api",
        environment=settings.environment,
    )


@app.get("/api/system/summary")
def system_summary(
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = get_model_service()

    # ---------------------------------------------------------
    # ML engine health
    # ---------------------------------------------------------
    try:
        service.load()
        ml_status = "healthy"
        model_ready = True

    except ModelNotReadyError:
        ml_status = "not_ready"
        model_ready = False

    # ---------------------------------------------------------
    # Database statistics
    # ---------------------------------------------------------
    transaction_count = (
        db.scalar(
            select(func.count()).select_from(
                TransactionRecord
            )
        )
        or 0
    )

    alert_count = (
        db.scalar(
            select(func.count())
            .select_from(AlertRecord)
            .where(
                AlertRecord.status == "Open"
            )
        )
        or 0
    )

    # ---------------------------------------------------------
    # REAL Kafka health check
    #
    # This requests broker metadata, so it verifies that the
    # Kafka broker is actually reachable instead of merely
    # checking whether the Producer object can be created.
    # ---------------------------------------------------------
    try:
        kafka_health = (
            get_kafka_service()
            .health_check()
        )
        kafka_status = kafka_health[
            "status"
        ]

    except Exception as exc:
        kafka_health = {
            "status": "unavailable",
            "bootstrap_servers": "localhost:9092",
            "topic": "fraudguard.transactions",
            "topic_exists": False,
            "broker_count": 0,
            "error": str(exc),
        }

        kafka_status = "unavailable"

    # ---------------------------------------------------------
    # System summary
    # ---------------------------------------------------------
    return {
        "api": "healthy",
        "kafka": kafka_status,
        "kafka_details": kafka_health,
        "database": "healthy",
        "ml_engine": ml_status,
        "model_ready": model_ready,
        "transactions_persisted": transaction_count,
        "open_alerts": alert_count,
        "latency_ms": {
            "ingestion": 0,
            "preprocessing": 0,
            "inference": 0,
            "persistence": 0,
            "kafka_publish": 0,
            "end_to_end": 0,
        },
    }


@app.get("/api/ml/metrics")
def ml_metrics() -> dict[str, Any]:
    service = get_model_service()

    try:
        return service.metrics

    except ModelNotReadyError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc


@app.get("/api/ml/status")
def ml_status() -> dict[str, Any]:
    service = get_model_service()

    try:
        service.load()

        metrics = service.metrics

        ensemble = next(
            item
            for item in metrics["models"]
            if item["model"] == "Ensemble"
        )

        return {
            "ready": True,
            "ensemble": ensemble,
            "artifact": str(
                service.model_paths["Ensemble"]
            ),
            "features": len(
                service.manifest["features"]
            ),
        }

    except (
        ModelNotReadyError,
        StopIteration,
    ) as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc


@app.get("/api/ml/sample")
def ml_sample(
    fraud: bool = False,
) -> dict[str, Any]:
    service = get_model_service()

    try:
        return service.sample(fraud)

    except ModelNotReadyError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc


@app.post("/api/ml/predict")
def ml_predict(
    payload: PredictionRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    service = get_model_service()

    try:
        # ---------------------------------------------------------
        # 1. Run the existing ensemble ML inference
        # ---------------------------------------------------------
        prediction = service.predict(
            payload.features
        )

        # ---------------------------------------------------------
        # 2. Preserve the existing SQL persistence behavior
        # ---------------------------------------------------------
        record = _persist_prediction(
            db,
            payload,
            prediction,
        )

        # ---------------------------------------------------------
        # 3. Publish the completed prediction to Kafka
        # ---------------------------------------------------------
        kafka_published = (
            _publish_transaction_event(
                payload,
                prediction,
                record,
            )
        )

        # ---------------------------------------------------------
        # 4. Return the existing prediction response
        #    plus Kafka status
        # ---------------------------------------------------------
        prediction["transaction_id"] = (
            record.id
        )
        prediction["persisted"] = True
        prediction["kafka_published"] = (
            kafka_published
        )
        prediction["created_at"] = (
            record.created_at.isoformat()
            if record.created_at
            else None
        )

        return prediction

    except ModelNotReadyError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc


@app.get("/api/transactions")
def transactions(
    limit: int = Query(
        default=25,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    search: str | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    stmt = select(TransactionRecord)

    count_stmt = (
        select(func.count())
        .select_from(TransactionRecord)
    )

    if search:
        term = (
            f"%{search.strip()}%"
        )

        condition = or_(
            TransactionRecord.id.ilike(
                term
            ),
            TransactionRecord.decision.ilike(
                term
            ),
            TransactionRecord.risk.ilike(
                term
            ),
        )

        stmt = stmt.where(condition)
        count_stmt = count_stmt.where(
            condition
        )

    rows = db.scalars(
        stmt
        .order_by(
            desc(
                TransactionRecord.created_at
            )
        )
        .offset(offset)
        .limit(limit)
    ).all()

    total = (
        db.scalar(count_stmt)
        or 0
    )

    return {
        "items": [
            _transaction_out(row)
            for row in rows
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/api/transactions/stats")
def transaction_stats(
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    total = (
        db.scalar(
            select(func.count())
            .select_from(
                TransactionRecord
            )
        )
        or 0
    )

    fraud = (
        db.scalar(
            select(func.count())
            .select_from(
                TransactionRecord
            )
            .where(
                TransactionRecord.is_fraud.is_(
                    True
                )
            )
        )
        or 0
    )

    blocked = (
        db.scalar(
            select(func.count())
            .select_from(
                TransactionRecord
            )
            .where(
                TransactionRecord.decision
                == "BLOCK"
            )
        )
        or 0
    )

    review = (
        db.scalar(
            select(func.count())
            .select_from(
                TransactionRecord
            )
            .where(
                TransactionRecord.decision
                == "REVIEW"
            )
        )
        or 0
    )

    approved = (
        db.scalar(
            select(func.count())
            .select_from(
                TransactionRecord
            )
            .where(
                TransactionRecord.decision
                == "APPROVE"
            )
        )
        or 0
    )

    return {
        "total": total,
        "fraud": fraud,
        "blocked": blocked,
        "review": review,
        "approved": approved,
        "fraud_rate": round(
            (
                fraud / total * 100
            )
            if total
            else 0.0,
            2,
        ),
    }