import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  BellRing,
  BrainCircuit,
  ChartNoAxesCombined,
  CircleHelp,
  CreditCard,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  Radar,
  ServerCog,
  ShieldCheck,
  SlidersHorizontal,
  Waypoints,
} from 'lucide-react'

const nav = [
  { label: 'Overview', to: '/', icon: LayoutDashboard },
  { label: 'Transactions', to: '/transactions', icon: CreditCard },
  { label: 'CSV Analyzer', to: '/csv-analyzer', icon: FileSpreadsheet },
  { label: 'Live Monitor', to: '/live', icon: Radar },
  { label: 'Analytics', to: '/analytics', icon: ChartNoAxesCombined },
  { label: 'Models', to: '/models', icon: BrainCircuit },
  { label: 'Alerts', to: '/alerts', icon: BellRing },
]

const systemNav = [
  { label: 'Data Pipeline', to: '/pipeline', icon: Waypoints },
  { label: 'Data Store', to: '/data-store', icon: Database },
  { label: 'System Health', to: '/system', icon: ServerCog },
  { label: 'Settings', to: '/settings', icon: SlidersHorizontal },
]

export default function Sidebar() {
  const location = useLocation()

  const active = (path: string) =>
    location.pathname === path ||
    (path !== '/' && location.pathname.startsWith(path))

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">
          <ShieldCheck size={20} strokeWidth={2.2} />
        </div>

        <div>
          <div className="brand-name">FraudGuard</div>
          <div className="brand-caption">INTELLIGENCE CONSOLE</div>
        </div>
      </div>

      <div className="workspace-pill">
        <span className="status-dot online" />
        <span>Production workspace</span>
        <Activity size={14} />
      </div>

      <div className="nav-section">
        <div className="nav-label">MONITORING</div>

        {nav.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`nav-item ${active(to) ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>

            {label === 'Alerts' && (
              <span className="nav-count">3</span>
            )}
          </Link>
        ))}
      </div>

      <div className="nav-section">
        <div className="nav-label">PLATFORM</div>

        {systemNav.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`nav-item ${active(to) ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        ))}
      </div>

      <div className="sidebar-spacer" />

      <div className="sidebar-footer-card">
        <div className="mini-icon">
          <CircleHelp size={16} />
        </div>

        <div>
          <div className="mini-title">Research prototype</div>
          <div className="mini-copy">ML + Kafka + SQL</div>
        </div>
      </div>
    </aside>
  )
}