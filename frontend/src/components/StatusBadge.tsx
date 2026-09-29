import type { RiskLevel } from '../lib/types'

export default function StatusBadge({ status, risk }: { status?: string; risk?: RiskLevel }) {
  const value = risk ?? status ?? 'Unknown'
  const key = value.toLowerCase().replace(' ', '-')
  return <span className={`status-badge ${key}`}>{value}</span>
}
