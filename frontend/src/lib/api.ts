export type ApiModelMetric = {
  model: string
  accuracy: number
  precision: number
  recall: number
  f1: number
  roc_auc: number
  pr_auc: number
  true_negative: number
  false_positive: number
  false_negative: number
  true_positive: number
  training_seconds: number
}

export type MlMetrics = {
  dataset: string
  target: string
  random_state: number
  rows: number
  features: string[]
  train_rows: number
  test_rows: number
  fraud_rows: number
  fraud_rate: number
  models: ApiModelMetric[]
  best_accuracy_model: string
  best_f1_model: string
  best_recall_model: string
}

export type MlStatus = {
  ready: boolean
  ensemble: ApiModelMetric
  artifact: string
  features: number
}

export type PredictionResponse = {
  prediction: number
  is_fraud: boolean
  fraud_probability: number
  fraud_score_percent: number
  risk: 'Low' | 'Medium' | 'High' | 'Critical'
  decision: 'APPROVE' | 'REVIEW' | 'BLOCK'
  model: string
  model_probabilities: Record<string, number>
  transaction_id?: string
  persisted?: boolean
  kafka_published?: boolean
  created_at?: string
}

export type DemoSample = {
  source: string
  features: Record<string, number>
  known_label: number
}

export type StoredTransaction = {
  id: string
  created_at: string | null
  amount: number
  fraud_probability: number
  fraud_score_percent: number
  risk: 'Low' | 'Medium' | 'High' | 'Critical'
  decision: 'APPROVE' | 'REVIEW' | 'BLOCK'
  is_fraud: boolean
  model: string
  source: string
  known_label: number | null
  features: Record<string, number>
  model_probabilities: Record<string, number>
}

export type TransactionResponse = {
  items: StoredTransaction[]
  total: number
  limit: number
  offset: number
}

export type TransactionStats = {
  total: number
  fraud: number
  blocked: number
  review: number
  approved: number
  fraud_rate: number
}

/*
|--------------------------------------------------------------------------
| System Health
|--------------------------------------------------------------------------
*/

export type KafkaHealth = {
  status: 'connected' | 'unavailable' | string
  bootstrap_servers: string
  topic: string
  topic_exists: boolean
  broker_count: number
  error?: string
}

export type SystemLatency = {
  ingestion: number
  preprocessing: number
  inference: number
  persistence: number
  kafka_publish: number
  end_to_end: number
}

export type SystemSummary = {
  api: 'healthy' | string
  kafka: 'connected' | 'unavailable' | string
  kafka_details: KafkaHealth
  database: 'healthy' | string
  ml_engine: 'healthy' | 'not_ready' | string
  model_ready: boolean
  transactions_persisted: number
  open_alerts: number
  latency_ms: SystemLatency
}

/*
|--------------------------------------------------------------------------
| Dashboard Overview
|--------------------------------------------------------------------------
*/

export type DashboardOverview = {
  system: SystemSummary
  transactions: TransactionStats
  ml: MlStatus
}

/*
|--------------------------------------------------------------------------
| Dashboard Activity
|--------------------------------------------------------------------------
*/

export type ActivityPoint = {
  timestamp: string
  label: string
  transactions: number
  fraud: number
  approved: number
  review: number
  blocked: number
}

/*
|--------------------------------------------------------------------------
| Dashboard Alerts
|--------------------------------------------------------------------------
*/

export type AlertLevel =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical'

export type AlertStatus =
  | 'Open'
  | 'Acknowledged'
  | 'Resolved'
  | string

export type DashboardAlert = {
  id: string
  transaction_id: string
  created_at: string | null
  level: AlertLevel
  title: string
  detail: string
  status: AlertStatus
  fraud_probability?: number
  fraud_score_percent?: number
  decision?: 'APPROVE' | 'REVIEW' | 'BLOCK'
}

/*
|--------------------------------------------------------------------------
| Dashboard Decision Analytics
|--------------------------------------------------------------------------
*/

export type DecisionMix = {
  total: number

  approve: {
    count: number
    percentage: number
  }

  review: {
    count: number
    percentage: number
  }

  block: {
    count: number
    percentage: number
  }

  fraud: {
    count: number
    percentage: number
  }
}

/*
|--------------------------------------------------------------------------
| Dashboard Model Health
|--------------------------------------------------------------------------
*/

export type ModelHealth = {
  model: string
  ready: boolean

  metrics: {
    accuracy: number
    precision: number
    recall: number
    f1: number
    roc_auc: number
    pr_auc: number
  }

  dataset: {
    name: string
    rows: number
    features: number
    train_rows: number
    test_rows: number
    fraud_rows: number
    fraud_rate: number
  }

  artifact: string

  performance: {
    training_seconds: number
    inference_ms: number
  }

  drift?: {
    score: number
    status: 'normal' | 'warning' | 'critical' | string
  }

  calibration?: {
    score: number
    status: 'normal' | 'warning' | 'critical' | string
  }
}

/*
|--------------------------------------------------------------------------
| Dashboard Stream Health
|--------------------------------------------------------------------------
*/

export type StreamHealth = {
  status: 'healthy' | 'degraded' | 'offline' | string

  kafka: KafkaHealth

  producer: {
    status: string
    messages_published: number
    publish_errors: number
  }

  consumer: {
    status: string
    messages_processed: number
    messages_failed: number
    consumer_group: string
    topic: string
    lag: number
  }

  throughput: {
    transactions_per_second: number
    transactions_per_minute: number
    fraud_per_minute: number
  }
}

/*
|--------------------------------------------------------------------------
| Generic API Request Helper
|--------------------------------------------------------------------------
*/

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:8000'

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(
    `${API_BASE}${path}`,
    options,
  )

  if (!response.ok) {
    const text = await response.text()

    throw new Error(
      text || `Request failed: ${response.status}`,
    )
  }

  return response.json() as Promise<T>
}

/*
|--------------------------------------------------------------------------
| System
|--------------------------------------------------------------------------
*/

export function getSystemSummary() {
  return request<SystemSummary>(
    '/api/system/summary',
  )
}

/*
|--------------------------------------------------------------------------
| Machine Learning
|--------------------------------------------------------------------------
*/

export function getModelMetrics() {
  return request<MlMetrics>(
    '/api/ml/metrics',
  )
}

export function getModelStatus() {
  return request<MlStatus>(
    '/api/ml/status',
  )
}

/*
|--------------------------------------------------------------------------
| Samples
|--------------------------------------------------------------------------
*/

export function getDemoSample(
  fraud = false,
) {
  return request<DemoSample>(
    `/api/ml/sample?fraud=${fraud}`,
  )
}

/*
|--------------------------------------------------------------------------
| Prediction
|--------------------------------------------------------------------------
*/

export function predictTransaction(
  features: Record<string, number>,
  knownLabel: number | null = null,
) {
  return request<PredictionResponse>(
    '/api/ml/predict',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        features,
        source: 'transaction-analyzer',
        known_label: knownLabel,
      }),
    },
  )
}

/*
|--------------------------------------------------------------------------
| Transactions
|--------------------------------------------------------------------------
*/

export function getTransactions(
  search = '',
) {
  const query = search
    ? `?search=${encodeURIComponent(search)}`
    : ''

  return request<TransactionResponse>(
    `/api/transactions${query}`,
  )
}

export function getTransactionStats() {
  return request<TransactionStats>(
    '/api/transactions/stats',
  )
}

/*
|--------------------------------------------------------------------------
| Dashboard - Overview
|--------------------------------------------------------------------------
|
| These functions are intentionally prepared as the dashboard API
| expands. We will implement the corresponding FastAPI endpoints
| incrementally instead of putting dashboard logic directly into
| the React components.
|
|--------------------------------------------------------------------------
*/

export function getDashboardOverview() {
  return request<DashboardOverview>(
    '/api/dashboard/overview',
  )
}

export function getDashboardActivity(
  range = '24h',
) {
  return request<ActivityPoint[]>(
    `/api/dashboard/activity?range=${encodeURIComponent(
      range,
    )}`,
  )
}

export function getDashboardAlerts(
  status = 'Open',
  limit = 10,
) {
  const params = new URLSearchParams({
    status,
    limit: String(limit),
  })

  return request<DashboardAlert[]>(
    `/api/dashboard/alerts?${params.toString()}`,
  )
}

export function getDashboardDecisionMix() {
  return request<DecisionMix>(
    '/api/dashboard/decision-mix',
  )
}

export function getDashboardModelHealth() {
  return request<ModelHealth>(
    '/api/dashboard/model-health',
  )
}

export function getDashboardStreamHealth() {
  return request<StreamHealth>(
    '/api/dashboard/stream-health',
  )
}