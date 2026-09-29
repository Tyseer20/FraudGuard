import type { ComponentType } from 'react'
import {
  CheckCircle2,
  Database,
  Gauge,
  Radio,
  Server,
  ShieldCheck,
} from 'lucide-react'

import SectionHeader from '../components/SectionHeader'
import StatusBadge from '../components/StatusBadge'

type ServiceStatus = 'Healthy' | 'Warning' | 'Offline'

type ServiceDefinition = {
  name: string
  detail: string
  status: ServiceStatus
  uptime: number
  icon: ComponentType<{ size?: number; className?: string }>
}

const services: ServiceDefinition[] = [
  {
    name: 'Frontend',
    detail: 'React/Vite console',
    status: 'Healthy',
    uptime: 99.99,
    icon: Server,
  },
  {
    name: 'API',
    detail: 'FastAPI prediction service',
    status: 'Healthy',
    uptime: 99.98,
    icon: Radio,
  },
  {
    name: 'Kafka',
    detail: 'fraud.transactions topic',
    status: 'Healthy',
    uptime: 99.97,
    icon: Radio,
  },
  {
    name: 'Database',
    detail: 'PostgreSQL event store',
    status: 'Healthy',
    uptime: 99.99,
    icon: Database,
  },
  {
    name: 'ML Engine',
    detail: 'Ensemble inference',
    status: 'Healthy',
    uptime: 99.94,
    icon: ShieldCheck,
  },
]

export default function SystemPage() {
  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="PLATFORM / OBSERVABILITY"
        title="System health"
        description="Operational status across the fraud detection stack."
        action={
          <span className="health-chip">
            <span className="status-dot online" />
            All systems operational
          </span>
        }
      />

      <div className="service-grid">
        {services.map(
          ({
            name,
            detail,
            status,
            uptime,
            icon: Icon,
          }) => (
            <section
              className="panel service-card"
              key={name}
            >
              <div className="service-icon">
                <Icon size={18} />
              </div>

              <div className="service-copy">
                <strong>{name}</strong>
                <span>{detail}</span>
              </div>

              <StatusBadge status={status} />

              <div className="service-uptime">
                <span>Uptime</span>
                <strong>{uptime}%</strong>
              </div>

              <CheckCircle2
                className="service-check"
                size={17}
              />
            </section>
          ),
        )}
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">LATENCY</div>
            <h2>Pipeline performance</h2>
          </div>
        </div>

        <div className="latency-grid">
          <div>
            <span>Ingestion</span>
            <strong>12 ms</strong>
            <small>Kafka consumer lag</small>
          </div>

          <div>
            <span>Preprocessing</span>
            <strong>7 ms</strong>
            <small>Feature transformation</small>
          </div>

          <div>
            <span>Inference</span>
            <strong>41 ms</strong>
            <small>Ensemble prediction</small>
          </div>

          <div>
            <span>Persistence</span>
            <strong>18 ms</strong>
            <small>SQL transaction write</small>
          </div>

          <div>
            <span>End-to-end</span>
            <strong>78 ms</strong>
            <small>Event to decision</small>
          </div>
        </div>

        <div className="latency-band">
          <Gauge size={17} />

          <span>
            Current end-to-end latency is within the
            configured research target of &lt;100 ms.
          </span>
        </div>
      </section>
    </div>
  )
}