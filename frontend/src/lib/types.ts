export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export type Transaction = {
  id: string
  time: string
  amount: number
  merchant: string
  country: string
  risk: RiskLevel
  score: number
  status: 'Approved' | 'Blocked' | 'Review'
}

export type ModelMetric = {
  name: string
  accuracy: number
  precision: number
  recall: number
  f1: number
  auc: number
}

export type Alert = {
  id: string
  title: string
  detail: string
  level: RiskLevel
  time: string
}
