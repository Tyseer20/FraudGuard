import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    environment: str = os.getenv("ENVIRONMENT", "development")
    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///../data/fraudguard.db",
    )
    kafka_bootstrap_servers: str = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    kafka_topic: str = os.getenv("KAFKA_TOPIC", "fraud.transactions")
    model_path: str = os.getenv("MODEL_PATH", "../ml/models/ensemble.joblib")

    @property
    def database_file(self) -> Path:
        return Path(__file__).resolve().parents[3] / "data" / "fraudguard.db"


settings = Settings()
