import type { Alert, ModelMetric, Transaction } from './types'

export const transactions: Transaction[] = [
  { id: 'TX-9F2A81', time: '10:42:31', amount: 1840.24, merchant: 'CloudMart EU', country: 'DE', risk: 'Critical', score: 98.4, status: 'Blocked' },
  { id: 'TX-9F2A7D', time: '10:42:10', amount: 284.11, merchant: 'Northline Travel', country: 'IN', risk: 'Low', score: 2.8, status: 'Approved' },
  { id: 'TX-9F2A79', time: '10:41:58', amount: 932.72, merchant: 'Luma Electronics', country: 'US', risk: 'High', score: 86.2, status: 'Review' },
  { id: 'TX-9F2A63', time: '10:41:42', amount: 72.19, merchant: 'Daily Basket', country: 'GB', risk: 'Low', score: 1.6, status: 'Approved' },
  { id: 'TX-9F2A51', time: '10:41:16', amount: 611.84, merchant: 'Vertex Media', country: 'SG', risk: 'Medium', score: 54.5, status: 'Review' },
  { id: 'TX-9F2A2C', time: '10:40:58', amount: 41.00, merchant: 'Metro Fuel', country: 'IN', risk: 'Low', score: 0.9, status: 'Approved' },
]

export const modelMetrics: ModelMetric[] = [
  { name: 'Logistic Regression', accuracy: 96.3, precision: 91.8, recall: 84.7, f1: 88.1, auc: 97.4 },
  { name: 'Random Forest', accuracy: 98.1, precision: 94.5, recall: 91.2, f1: 92.8, auc: 99.0 },
  { name: 'XGBoost', accuracy: 98.6, precision: 95.7, recall: 93.4, f1: 94.5, auc: 99.3 },
  { name: 'Ensemble', accuracy: 98.9, precision: 96.4, recall: 94.8, f1: 95.6, auc: 99.5 },
]

export const alerts: Alert[] = [
  { id: 'AL-3019', title: 'High-risk transaction blocked', detail: 'TX-9F2A81 • 98.4% fraud probability', level: 'Critical', time: '34 sec ago' },
  { id: 'AL-3018', title: 'Velocity anomaly detected', detail: '7 attempts from the same device in 2 min', level: 'High', time: '2 min ago' },
  { id: 'AL-3017', title: 'Model drift watch', detail: 'Recall moved 1.2% below the configured baseline', level: 'Medium', time: '12 min ago' },
]

export const activity = [
  { label: '10:35', transactions: 320, fraud: 11 },
  { label: '10:36', transactions: 344, fraud: 15 },
  { label: '10:37', transactions: 372, fraud: 13 },
  { label: '10:38', transactions: 361, fraud: 18 },
  { label: '10:39', transactions: 402, fraud: 17 },
  { label: '10:40', transactions: 438, fraud: 23 },
  { label: '10:41', transactions: 451, fraud: 19 },
  { label: '10:42', transactions: 472, fraud: 27 },
]
