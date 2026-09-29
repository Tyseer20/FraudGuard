import { Activity, CircleDot, Cpu, Gauge, Radio, Zap } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'

const streamCards = [
  ['Kafka topic', 'fraud.transactions', 'Healthy', Radio],
  ['Consumer lag', '12 ms', 'Nominal', Gauge],
  ['Inference latency', '41 ms', 'Fast', Zap],
  ['Events / sec', '472', 'Streaming', Activity],
] as const

export default function LiveMonitor() {
  return <div className="page-stack"><SectionHeader eyebrow="REAL-TIME / STREAMING" title="Live fraud monitor" description="Observe the transaction stream from ingestion through ensemble inference and decisioning." action={<div className="stream-live"><span className="status-dot online" /> LIVE</div>} />
    <div className="four-grid">{streamCards.map(([label, value, status, Icon]) => <section className="panel stream-card" key={label}><div className="stream-icon"><Icon size={18} /></div><span>{label}</span><strong>{value}</strong><small><span className="status-dot online" /> {status}</small></section>)}</div>
    <section className="panel stream-console"><div className="panel-heading"><div><div className="eyebrow">EVENT STREAM</div><h2>Incoming decisions</h2></div><span className="stream-console-status"><CircleDot size={13} /> Consumer active</span></div>
      <div className="event-feed">{Array.from({ length: 9 }).map((_, i) => <div className={`event-line ${i === 0 ? 'highlight' : ''}`} key={i}><span className="event-time">10:42:{31 - i * 3 < 10 ? `0${31 - i * 3}` : 31 - i * 3}</span><span className="event-dot" /><span className="event-id">TX-9F2A{81 - i}</span><span className="event-text">Model inference completed</span><span className="event-score">{(98.4 - i * 8.7).toFixed(1)}%</span></div>)}</div>
    </section>
    <div className="grid-2-1"><section className="panel architecture-panel"><div className="panel-heading"><div><div className="eyebrow">PIPELINE</div><h2>Streaming path</h2></div></div><div className="pipeline-row"><div className="pipeline-node source"><Radio size={17}/><span>Producer</span><small>Transactions</small></div><div className="pipeline-link active"/><div className="pipeline-node"><Radio size={17}/><span>Kafka</span><small>Topic broker</small></div><div className="pipeline-link active"/><div className="pipeline-node"><Cpu size={17}/><span>Ensemble</span><small>Inference API</small></div><div className="pipeline-link active"/><div className="pipeline-node"><Activity size={17}/><span>Decision</span><small>Alert + SQL</small></div></div></section><section className="panel architecture-panel"><div className="panel-heading"><div><div className="eyebrow">SIMULATION</div><h2>Stream controls</h2></div></div><div className="control-row"><span>Generator rate</span><strong>8 events/sec</strong></div><input className="range-input" type="range" min="1" max="20" defaultValue="8" /><div className="control-actions"><button className="primary-button">Start stream</button><button className="ghost-button">Pause</button></div></section></div>
  </div>
}
