from __future__ import annotations

import json
import os
import signal
import sys
from typing import Any

from confluent_kafka import Consumer, KafkaException, KafkaError


BOOTSTRAP_SERVERS = os.getenv(
    "KAFKA_BOOTSTRAP_SERVERS",
    "localhost:9092",
)

TOPIC = os.getenv(
    "KAFKA_TOPIC",
    "fraudguard.transactions",
)

GROUP_ID = os.getenv(
    "KAFKA_GROUP_ID",
    "fraudguard-realtime-worker",
)


class FraudGuardKafkaConsumer:
    """Consumes FraudGuard prediction events from Apache Kafka."""

    def __init__(self) -> None:
        self.running = True

        self.consumer = Consumer(
            {
                "bootstrap.servers": BOOTSTRAP_SERVERS,
                "group.id": GROUP_ID,
                "auto.offset.reset": "earliest",
                "enable.auto.commit": False,
                "client.id": "fraudguard-realtime-worker",
            }
        )

        self.consumer.subscribe([TOPIC])

    def stop(self, *_args: Any) -> None:
        print("\nStopping FraudGuard Kafka consumer...")
        self.running = False

    def process_event(self, event: dict[str, Any]) -> None:
        event_type = event.get("event_type")
        transaction_id = event.get("transaction_id")
        prediction = event.get("prediction", {})

        risk = prediction.get("risk", "Unknown")
        decision = prediction.get("decision", "Unknown")
        fraud_probability = prediction.get(
            "fraud_probability",
            0.0,
        )
        is_fraud = prediction.get(
            "is_fraud",
            False,
        )

        print("\n" + "=" * 70)
        print("FRAUDGUARD REAL-TIME EVENT")
        print("=" * 70)

        print(f"Event type:          {event_type}")
        print(f"Transaction ID:      {transaction_id}")
        print(f"Fraud probability:   {float(fraud_probability) * 100:.4f}%")
        print(f"Fraud detected:      {is_fraud}")
        print(f"Risk level:          {risk}")
        print(f"Decision:            {decision}")

        if is_fraud or risk in {"High", "Critical"}:
            print("\n🚨 FRAUD ALERT")
            print(
                f"Transaction {transaction_id} "
                f"requires attention."
            )
        else:
            print("\n✓ Transaction processed normally.")

        print("=" * 70)

    def run(self) -> None:
        print("FraudGuard Kafka Consumer")
        print("-" * 70)
        print(f"Bootstrap server: {BOOTSTRAP_SERVERS}")
        print(f"Topic:            {TOPIC}")
        print(f"Consumer group:   {GROUP_ID}")
        print("-" * 70)
        print("Waiting for Kafka events...\n")

        try:
            while self.running:
                message = self.consumer.poll(1.0)

                if message is None:
                    continue

                if message.error():
                    if message.error().code() == KafkaError._PARTITION_EOF:
                        continue

                    raise KafkaException(message.error())

                try:
                    raw_value = message.value()

                    if raw_value is None:
                        print("Received empty Kafka message.")
                        continue

                    event = json.loads(
                        raw_value.decode("utf-8")
                    )

                    if not isinstance(event, dict):
                        print(
                            "Ignoring Kafka message because "
                            "the payload is not a JSON object."
                        )
                        continue

                    self.process_event(event)

                    self.consumer.commit(
                        message=message,
                        asynchronous=False,
                    )

                    print(
                        "Kafka offset committed: "
                        f"partition={message.partition()} "
                        f"offset={message.offset()}"
                    )

                except json.JSONDecodeError as exc:
                    print(
                        f"Invalid JSON received from Kafka: {exc}"
                    )

                except Exception as exc:
                    print(
                        f"Event processing failed: {exc}"
                    )

        except KeyboardInterrupt:
            print("\nConsumer interrupted by user.")

        finally:
            self.consumer.close()
            print("Kafka consumer closed.")


def main() -> None:
    worker = FraudGuardKafkaConsumer()

    signal.signal(
        signal.SIGINT,
        worker.stop,
    )

    if hasattr(signal, "SIGTERM"):
        signal.signal(
            signal.SIGTERM,
            worker.stop,
        )

    worker.run()


if __name__ == "__main__":
    main()