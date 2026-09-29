import type { ReactNode } from 'react'

export default function KpiCard({ label, value, delta, tone, icon }: {
  label: string
  value: string
  delta: string
  tone?: 'good' | 'warn' | 'bad'
  icon: ReactNode
}) {
  return (
    <section className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <div className="kpi-icon">{icon}</div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-delta ${tone ?? 'good'}`}>{delta}</div>
    </section>
  )
}
