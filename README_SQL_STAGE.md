# FraudGuard — SQL persistence stage

This stage adds SQL persistence to the existing FraudGuard transaction-inference build.

## What it adds

- SQLAlchemy ORM models for transactions and alerts.
- SQLite by default at `data/fraudguard.db` for zero-config local development.
- Optional PostgreSQL via `DATABASE_URL`.
- Every `/api/ml/predict` request is persisted automatically.
- High/Critical predictions create an open alert record.
- `GET /api/transactions` returns recent persisted transactions.
- `GET /api/transactions/stats` returns database statistics.
- React Transactions page reads the real SQL history.

## Files to copy

Backend:
- `backend/app/core/config.py`
- `backend/app/db.py`
- `backend/app/models_db.py`
- `backend/app/main.py`

Frontend:
- `frontend/src/lib/api.ts`
- `frontend/src/components/TransactionTable.tsx`
- `frontend/src/pages/Transactions.tsx`
- append `frontend/src/styles-sql-additions.css` to your existing `frontend/src/styles.css`

The existing `backend/app/services/model_service.py` is included as a matching reference copy.

## Start

From `FraudGuard/backend` with the existing `.venv` active:

```powershell
uvicorn app.main:app --reload --port 8000
```

The database is created automatically on startup.

Test:

```text
http://localhost:8000/docs
http://localhost:8000/api/transactions
http://localhost:8000/api/transactions/stats
```
