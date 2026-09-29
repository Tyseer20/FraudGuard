
# FraudGuard

### An Ensemble Machine Learning Framework for Real-Time Financial Fraud Detection

FraudGuard is a research-oriented fraud detection platform that combines **ensemble machine learning, real-time event streaming, SQL persistence, REST APIs, and an interactive monitoring dashboard** into a unified fraud intelligence system.

The platform is designed to support both **individual transaction inference** and **batch CSV analysis**, while providing experimental results suitable for academic research and reproducibility.


## Overview

Financial fraud detection is challenging because fraudulent transactions are rare, transaction patterns evolve continuously, and detection systems must balance false positives against missed fraud.

FraudGuard addresses these challenges through a layered architecture that combines:

- **Logistic Regression**
- **Random Forest**
- **XGBoost**
- **Ensemble classification**
- **Isolation Forest anomaly detection**
- **Apache Kafka event streaming**
- **FastAPI REST services**
- **SQL transaction persistence**
- **React + TypeScript monitoring interface**

The primary supervised learning pipeline is trained and evaluated on the well-known credit-card fraud benchmark dataset, while the CSV Analyzer supports datasets with different schemas through a generic anomaly-detection workflow.


## Key Features

### Ensemble Fraud Detection

FraudGuard evaluates multiple machine learning models and combines them into an ensemble decision pipeline.

The implemented models include:

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
|---|---:|---:|---:|---:|---:|---:|
| Logistic Regression | 97.5545% | 6.1017% | 91.8367% | 11.4431% | 97.2093% | 71.8935% |
| Random Forest | 99.9508% | 94.8718% | 75.5102% | 84.0909% | 95.1760% | 86.1183% |
| XGBoost | 99.9491% | 87.0968% | 82.6531% | 84.8168% | 97.5350% | 87.2057% |
| **Ensemble** | **99.9544%** | **89.1304%** | **83.6735%** | **86.3158%** | **97.2277%** | **85.9980%** |

The ensemble achieved an accuracy above the project's original target of 95%.

Because the dataset is highly imbalanced, FraudGuard reports multiple metrics rather than relying on accuracy alone.


## Real-Time Event Processing

FraudGuard integrates **Apache Kafka** as the event-streaming layer.

A completed fraud prediction can be published as a structured event to the Kafka topic:

```text
fraudguard.transactions
````

The local Kafka deployment uses:

```text
Broker: localhost:9092
Topic: fraudguard.transactions
Partitions: 3
```

The Kafka workflow supports event-oriented transaction processing and provides a foundation for future high-throughput streaming deployments.

---

## System Architecture

```text
                    ┌─────────────────────────┐
                    │      React Frontend      │
                    │   TypeScript + Vite      │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       FastAPI API        │
                    │   REST + Validation      │
                    └──────┬─────────┬────────┘
                           │         │
                ┌──────────┘         └────────────┐
                ▼                                 ▼
     ┌────────────────────┐             ┌──────────────────┐
     │   ML Inference     │             │   CSV Analyzer   │
     │ Logistic Regression│             │ Isolation Forest │
     │ Random Forest      │             │ Schema Detection │
     │ XGBoost            │             │ Batch Analysis   │
     │ Ensemble           │             └──────────────────┘
     └──────────┬─────────┘
                │
                ├───────────────────┐
                ▼                   ▼
     ┌──────────────────┐  ┌───────────────────┐
     │    SQL Database  │  │   Apache Kafka    │
     │ Transaction Data │  │ Event Streaming   │
     │ Alert History    │  │ Fraud Predictions │
     └──────────────────┘  └───────────────────┘
```

---

## Technology Stack

### Frontend

* React 19
* TypeScript
* Vite
* React Router
* Recharts
* Lucide React

### Backend

* Python 3.12
* FastAPI
* Pydantic
* SQLAlchemy
* Psycopg
* Pandas
* NumPy

### Machine Learning

* Scikit-learn
* XGBoost
* Joblib

### Streaming

* Apache Kafka
* Confluent Kafka client
* Docker

### Database

* SQLAlchemy
* SQLite for the current local prototype
* PostgreSQL-ready architecture

---

## Project Structure

```text
FraudGuard/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── csv_analyzer.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── services/
│   │   │   ├── kafka_service.py
│   │   │   └── model_service.py
│   │   ├── workers/
│   │   │   └── kafka_consumer.py
│   │   ├── db.py
│   │   ├── main.py
│   │   └── models_db.py
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Overview.tsx
│   │   │   ├── Transactions.tsx
│   │   │   ├── LiveMonitor.tsx
│   │   │   ├── Analytics.tsx
│   │   │   ├── Models.tsx
│   │   │   ├── Alerts.tsx
│   │   │   ├── Pipeline.tsx
│   │   │   ├── SystemPage.tsx
│   │   │   └── CsvAnalyzer.tsx
│   │   ├── lib/
│   │   ├── App.tsx
│   │   └── styles.css
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── ml/
│   ├── data/
│   │   └── raw/
│   ├── models/
│   │   ├── manifest.json
│   │   ├── metrics.json
│   │   └── model_comparison.csv
│   ├── training/
│   │   └── train_ensemble.py
│   └── requirements.txt
│
├── infra/
│   └── docker-compose.yml
│
├── data/
│   └── fraudguard.db
│
├── docs/
│   ├── ARCHITECTURE.md
│   └── IMPLEMENTATION_PLAN.md
│
├── .env.example
├── .gitignore
├── README.md
└── README_SQL_STAGE.md
```

---

# Machine Learning Pipeline

The supervised fraud detection pipeline uses the following feature representation:

```text
Time
V1
V2
...
V28
Amount
```

The training workflow consists of:

```text
Raw Dataset
     ↓
Data Validation
     ↓
Feature Preparation
     ↓
Train/Test Split
     ↓
Individual Models
     ├── Logistic Regression
     ├── Random Forest
     └── XGBoost
     ↓
Ensemble Prediction
     ↓
Evaluation
     ↓
Persisted Model Artifacts
```

Model metrics and comparison results are stored under:

```text
ml/models/
```

---

# CSV Analyzer

FraudGuard also provides a dedicated **CSV Analyzer** accessible from the web interface.

The analyzer detects whether an uploaded dataset is compatible with the currently trained supervised model.

### Compatible Dataset

For a dataset containing the expected credit-card features:

```text
Time
V1 ... V28
Amount
```

FraudGuard can use the trained supervised ensemble.

### Different Dataset Schema

For datasets with different transaction fields, FraudGuard uses:

```text
Isolation Forest
```

to perform unsupervised anomaly detection.

This allows the application to analyze datasets containing different structures without incorrectly pretending that the existing supervised model was trained on those features.

### Important Interpretation

In anomaly-detection mode:

```text
Anomaly ≠ confirmed fraud
```

A flagged transaction represents an observation that is statistically unusual relative to the uploaded dataset.

When a dataset includes a fraud/class label, the analyzer can additionally compare the anomaly results against those labels and report evaluation metrics.

---

# API

FraudGuard exposes REST endpoints through FastAPI.

### Health

```http
GET /api/health
```

### System Status

```http
GET /api/system/summary
```

### Machine Learning Metrics

```http
GET /api/ml/metrics
```

### Machine Learning Status

```http
GET /api/ml/status
```

### Sample Transaction

```http
GET /api/ml/sample
```

### Fraud Prediction

```http
POST /api/ml/predict
```

### Transaction History

```http
GET /api/transactions
```

### Transaction Statistics

```http
GET /api/transactions/stats
```

### CSV Analysis

```http
POST /api/csv/analyze
```

Interactive API documentation is available through:

```text
http://localhost:8000/docs
```

---

# Transaction Processing

When a transaction is submitted for prediction, FraudGuard follows this workflow:

```text
Transaction Input
       ↓
Feature Validation
       ↓
ML Ensemble Inference
       ↓
Fraud Probability
       ↓
Risk Classification
       ↓
Decision
       ↓
SQL Persistence
       ↓
Alert Creation (when applicable)
       ↓
Kafka Event Publication
```

The prediction response includes information such as:

* Fraud probability
* Fraud score
* Risk level
* Decision
* Model used
* Model-level probabilities
* Transaction identifier
* Persistence status
* Kafka publication status

---

# Risk and Decision Layer

The inference service converts the model output into an operational fraud-management result.

Conceptually:

```text
Low Risk
    ↓
APPROVE

Moderate Risk
    ↓
REVIEW

High Risk
    ↓
BLOCK
```

The final operational interpretation depends on the configured decision thresholds.

---

# Dashboard

The FraudGuard frontend provides an interactive intelligence console containing:

### Overview

High-level fraud monitoring and system KPIs.

### Transactions

Historical transactions, predictions, risk levels, and decisions.

### Live Monitor

Real-time monitoring interface for transaction activity.

### Analytics

Visual analysis of fraud-related metrics and model behavior.

### Models

Comparison of machine learning models and their evaluation metrics.

### Alerts

Monitoring of high-risk transaction alerts.

### Data Pipeline

Kafka and processing pipeline information.

### Data Store

SQL-backed transaction and decision history.

### System Health

Backend, ML, Kafka, database, and latency information.

### CSV Analyzer

Upload and analyze external CSV datasets.

---

# Running the Project Locally

## 1. Clone the repository

```bash
git clone https://github.com/Tyseer20/FraudGuard.git
cd FraudGuard
```

---

## 2. Backend Setup

Create and activate the Python environment:

### Windows

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

The CSV upload endpoint also requires:

```powershell
pip install python-multipart
```

Start FastAPI:

```powershell
python -m uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

## 3. Frontend Setup

Open another terminal:

```powershell
cd frontend
pnpm install
pnpm dev
```

Frontend:

```text
http://localhost:5173
```

---

## 4. Kafka Setup

Kafka is provided through Docker Compose.

From the project root:

```powershell
docker compose -f infra/docker-compose.yml up -d
```

Verify the container:

```powershell
docker ps
```

The Kafka broker is exposed locally on:

```text
localhost:9092
```

---

# Development Commands

### Frontend

```powershell
cd frontend
pnpm dev
```

Build production frontend:

```powershell
pnpm build
```

### Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload --port 8000
```

### Kafka

Start:

```powershell
docker compose -f infra/docker-compose.yml up -d
```

Stop:

```powershell
docker compose -f infra/docker-compose.yml down
```

---

# Research Context

FraudGuard was developed as a research-oriented prototype for investigating the application of ensemble machine learning and event-driven processing to financial fraud detection.

The research focuses on:

1. Evaluating individual machine learning algorithms.
2. Evaluating an ensemble fraud classifier.
3. Comparing precision, recall, F1-score, ROC-AUC, and PR-AUC.
4. Investigating the role of Apache Kafka in event-driven fraud processing.
5. Persisting transaction decisions for reproducibility and analysis.
6. Providing a monitoring interface for operational fraud intelligence.
7. Exploring anomaly detection for datasets with schemas different from the supervised training data.

---

# Experimental Dataset

The main supervised experiment uses a highly imbalanced financial transaction dataset containing:

```text
Total transactions: 284,807
Fraudulent transactions: 492
Training records: 227,845
Test records: 56,962
```

Fraud represents only a small fraction of the total transactions, making class imbalance an important consideration when interpreting model performance.

---

# Limitations

FraudGuard is currently a **research prototype**, not a production banking system.

Important limitations include:

* The supervised ensemble expects the feature representation used during training.
* Arbitrary CSV schemas cannot automatically be classified by the supervised ensemble.
* Generic datasets are handled through anomaly detection rather than a fraud-specific supervised model.
* Anomaly detection results should not be interpreted as confirmed fraud.
* Kafka is currently configured for the local development environment.
* Some secondary dashboard controls are prototype/interface elements rather than complete production configuration workflows.
* Production deployment requires appropriate security, authentication, scalable database infrastructure, cloud Kafka infrastructure, monitoring, and secret management.

---

# Future Work

Potential future extensions include:

* Automated schema mapping and feature engineering
* Dataset-specific model training
* Streaming inference directly inside the Kafka consumer pipeline
* Distributed Kafka deployment
* PostgreSQL production deployment
* Model explainability using SHAP
* Threshold optimization for highly imbalanced datasets
* Concept-drift detection
* Automated model retraining
* Authentication and role-based access control
* Background processing for very large CSV datasets
* Production-grade observability and logging

---

# Security Considerations

This project is intended for research and demonstration purposes.

For a production deployment, additional controls should be implemented, including:

* Authentication and authorization
* HTTPS
* Secure secret management
* Input validation
* Rate limiting
* Audit logging
* Database access controls
* Secure Kafka configuration
* Personally identifiable information protection
* Model and data access policies

---

# License

This project is currently intended for academic and research purposes.

A formal open-source license can be added when the publication and distribution requirements are finalized.

---

# Author

**Tayseer Ayasou**

Computer Science Engineering
Chandigarh University, India

GitHub:
[https://github.com/Tyseer20](https://github.com/Tyseer20)

---

# Project Status

**Research Prototype — Active Development**

FraudGuard currently integrates:

```text
✓ Ensemble Machine Learning
✓ Logistic Regression
✓ Random Forest
✓ XGBoost
✓ Isolation Forest
✓ FastAPI REST API
✓ React + TypeScript Dashboard
✓ SQL Persistence
✓ Apache Kafka
✓ Transaction Monitoring
✓ Alert Management
✓ CSV Dataset Analysis
✓ Model Evaluation
```

---

## Acknowledgement

This project was developed as part of an academic/research effort exploring machine learning, real-time data processing, and intelligent fraud detection systems.

