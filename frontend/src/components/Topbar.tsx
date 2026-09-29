import { Bell, ChevronDown, Command, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Topbar() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  return (
    <header className="topbar">
      <div className="search-shell">
        <Search size={16} />
        <input aria-label="Search" placeholder="Search transactions, alerts, models..." />
        <div className="shortcut"><Command size={12} /> K</div>
      </div>

      <div className="topbar-actions">
        <div className="live-chip"><span className="status-dot online" /> Systems nominal</div>
        <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon-button notification-button" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>
        <div className="avatar">TA</div>
        <div className="profile-copy">
          <strong>Analyst</strong>
          <span>Fraud Operations</span>
        </div>
        <ChevronDown size={15} className="muted-icon" />
      </div>
    </header>
  )
}
