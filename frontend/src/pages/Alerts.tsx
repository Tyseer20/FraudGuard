import { AlertTriangle, CheckCircle2, Filter } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import StatusBadge from '../components/StatusBadge'
import { alerts } from '../lib/mockData'

export default function Alerts() {
  return <div className="page-stack"><SectionHeader eyebrow="MONITORING / ALERTS" title="Fraud alerts" description="Review model-generated incidents, operational anomalies, and system-level research warnings." action={<button className="ghost-button"><Filter size={15}/> Filters</button>} />
    <div className="alert-page-grid"><section className="panel alert-list-panel">{alerts.map((a) => <div className="full-alert" key={a.id}><div className={`full-alert-icon ${a.level.toLowerCase()}`}><AlertTriangle size={18}/></div><div className="full-alert-body"><div className="alert-top"><div><strong>{a.title}</strong><small>{a.id} • {a.time}</small></div><StatusBadge risk={a.level}/></div><p>{a.detail}</p><div className="alert-actions"><button className="ghost-button">Investigate</button><button className="ghost-button">Acknowledge</button></div></div></div>)}</section><section className="panel alert-summary"><div className="panel-heading"><div><div className="eyebrow">QUEUE HEALTH</div><h2>Response summary</h2></div></div><div className="summary-row"><span>Open</span><strong>3</strong></div><div className="summary-row"><span>Acknowledged</span><strong>18</strong></div><div className="summary-row"><span>Resolved today</span><strong>47</strong></div><div className="summary-success"><CheckCircle2 size={17}/><div><strong>100% pipeline uptime</strong><p>No alert delivery failures in the last 24h.</p></div></div></section></div>
  </div>
}
