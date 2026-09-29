from __future__ import annotations

import json
from typing import Any

from confluent_kafka import KafkaException, Producer


class KafkaService:
    """Publishes FraudGuard transaction events to Apache Kafka."""

    def __init__(
        self,
        bootstrap_servers: str = "localhost:9092",
        topic: str = "fraudguard.transactions",
    ) -> None:
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic

        self._producer = Producer(
            {
                "bootstrap.servers": self.bootstrap_servers,
                "client.id": "fraudguard-api",
            }
        )

    def _delivery_report(
        self,
        err: Any,
        message: Any,
    ) -> None:
        if err is not None:
            print(f"Kafka delivery failed: {err}")
            return

        print(
            "Kafka message delivered: "
            f"topic={message.topic()} "
            f"partition={message.partition()} "
            f"offset={message.offset()}"
        )

    def publish_transaction(
        self,
        transaction: dict[str, Any],
    ) -> None:
        payload = json.dumps(
            transaction,
            separators=(",", ":"),
        )

        self._producer.produce(
            topic=self.topic,
            value=payload.encode("utf-8"),
            callback=self._delivery_report,
        )

        # Force delivery for this integration stage.
        self._producer.flush(timeout=5)

    def health_check(self) -> dict[str, Any]:
        """
        Verify that the Kafka broker is reachable.

        Unlike simply constructing the Producer, this requests
        broker metadata and therefore checks actual connectivity.
        """

        try:
            metadata = self._producer.list_topics(
                timeout=3
            )

            topic_exists = (
                self.topic in metadata.topics
            )

            return {
                "status": "connected",
                "bootstrap_servers": self.bootstrap_servers,
                "topic": self.topic,
                "topic_exists": topic_exists,
                "broker_count": len(
                    metadata.brokers
                ),
            }

        except KafkaException as exc:
            return {
                "status": "unavailable",
                "bootstrap_servers": self.bootstrap_servers,
                "topic": self.topic,
                "topic_exists": False,
                "broker_count": 0,
                "error": str(exc),
            }

        except Exception as exc:
            return {
                "status": "unavailable",
                "bootstrap_servers": self.bootstrap_servers,
                "topic": self.topic,
                "topic_exists": False,
                "broker_count": 0,
                "error": str(exc),
            }


_kafka_service: KafkaService | None = None


def get_kafka_service() -> KafkaService:
    global _kafka_service

    if _kafka_service is None:
        _kafka_service = KafkaService()

    return _kafka_service