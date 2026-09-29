import type { ReactNode } from 'react'
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BrainCircuit, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import KpiCard from '../components/KpiCard'
import SectionHeader from '../components/SectionHeader'
import StatusBadge from '../components/StatusBadge'
import TransactionTable from '../components/TransactionTable'
import { activity, alerts } from '../lib/mockData'

function MiniStat({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: ReactNode }) {
  return <div className="mini-stat"><div className="mini-stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>
}

export default function Overview() {
  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="FRAUD INTELLIGENCE / OVERVIEW"
        title="Command center"
        description="Monitor transaction risk, model performance, and the real-time detection pipeline from one place."
        action={<button className="primary-button"><Activity size={16} /> Stream test transaction</button>}
      />

      <div className="kpi-grid">
        <KpiCard label="Transactions today" value="184,729" delta="↑ 12.4% vs yesterday" icon={<Activity size={18} />} />
        <KpiCard label="Fraud detected" value="2,941" delta="↓ 3.8% vs yesterday" tone="good" icon={<ShieldAlert size={18} />} />
        <KpiCard label="Blocked volume" value="$1.82M" delta="↑ 8.7% protected" icon={<ShieldCheck size={18} />} />
        <KpiCard label="Ensemble recall" value="94.8%" delta="↑ 2.1 pts vs baseline" icon={<BrainCircuit size={18} />} />
      </div>

      <div className="grid-2-1">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div><div className="eyebrow">STREAM HEALTH</div><h2>Transaction activity</h2></div>
            <div className="legend-row"><span><i className="legend-dot transactions" />Transactions</span><span><i className="legend-dot fraud" />Fraud alerts</span></div>
          </div>
          <div className="chart-box large-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="txFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(108, 92, 231, .33)"/><stop offset="100%" stopColor="rgba(108, 92, 231, 0)"/></linearGradient>
                  <linearGradient id="fraudFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(245, 158, 11, .25)"/><stop offset="100%" stopColor="rgba(245, 158, 11, 0)"/></linearGradient>
                </defs>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--panel-strong)', border: '1px solid var(--border)', borderRadius: 14, color: 'var(--text)' }} />
                <Area type="monotone" dataKey="transactions" stroke="#8b7cff" strokeWidth={2.5} fill="url(#txFill)" />
                <Area type="monotone" dataKey="fraud" stroke="#f59e0b" strokeWidth={2} fill="url(#fraudFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-footer"><span><strong>472</strong> tx/min current rate</span><span><strong>27</strong> fraud signals/min</span><span><strong>5.72%</strong> current alert ratio</span></div>
        </section>

        <section className="panel alerts-panel">
          <div className="panel-heading"><div><div className="eyebrow">PRIORITY QUEUE</div><h2>Active alerts</h2></div><span className="count-pill">3 open</span></div>
          <div className="alert-stack">
            {alerts.map((alert) => <div className="alert-card" key={alert.id}><div className={`alert-severity ${alert.level.toLowerCase()}`}><AlertTriangle size={16} /></div><div className="alert-content"><div className="alert-top"><strong>{alert.title}</strong><StatusBadge risk={alert.level} /></div><p>{alert.detail}</p><small>{alert.time}</small></div></div>)}
          </div>
          <button className="ghost-button full-width">View all alerts <ArrowUpRight size={15} /></button>
        </section>
      </div>

      <div className="three-grid">
        <section className="panel compact-panel">
          <div className="panel-heading"><div><div className="eyebrow">RISK ENGINE</div><h2>Decision mix</h2></div></div>
          <MiniStat label="Blocked" value="2.1%" detail="3,879 transactions" icon={<ShieldAlert size={16} />} />
          <MiniStat label="Manual review" value="4.7%" detail="8,689 transactions" icon={<AlertTriangle size={16} />} />
          <MiniStat label="Approved" value="93.2%" detail="172,161 transactions" icon={<ShieldCheck size={16} />} />
        </section>
        <section className="panel compact-panel">
          <div className="panel-heading"><div><div className="eyebrow">MODEL HEALTH</div><h2>Ensemble status</h2></div><StatusBadge status="Healthy" /></div>
          <div className="model-health-row"><div><span>Drift score</span><strong>0.08</strong></div><div className="health-track"><div style={{ width: '18%' }} /></div></div>
          <div className="model-health-row"><div><span>Calibration</span><strong>98.7%</strong></div><div className="health-track"><div style={{ width: '92%' }} /></div></div>
          <div className="model-health-row"><div><span>Inference</span><strong>41 ms</strong></div><div className="health-track"><div style={{ width: '76%' }} /></div></div>
          <div className="model-note"><ArrowDownRight size={15} /> Within configured research baseline</div>
        </section>
        <section className="panel compact-panel protected-panel"><div className="protected-shield"><ShieldCheck size={30} /></div><div><div className="eyebrow">PROTECTED</div><h2>$1.82M</h2><p>Estimated transaction volume prevented from confirmed fraud today.</p></div><div className="protected-growth"><ArrowUpRight size={14} /> 8.7%</div></section>
      </div>

      <section className="panel table-panel"><div className="panel-heading"><div><div className="eyebrow">LATEST ACTIVITY</div><h2>Recent transactions</h2></div><button className="ghost-button">Open explorer <ArrowUpRight size={15} /></button></div><TransactionTable compact /></section>
    </div>
  )
}
