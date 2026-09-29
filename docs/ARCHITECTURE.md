# FraudGuard Architecture

## Logical flow

Transaction source → Kafka producer → Kafka topic → inference consumer → preprocessing → ensemble model → PostgreSQL → FastAPI → React console.

## Research boundary

Training and evaluation are offline. Inference is online. The same preprocessing artifact used during training must be reused during live prediction to keep feature transformations consistent.
