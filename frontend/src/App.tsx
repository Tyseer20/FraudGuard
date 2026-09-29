import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Overview from './pages/Overview'
import Transactions from './pages/Transactions'
import LiveMonitor from './pages/LiveMonitor'
import Analytics from './pages/Analytics'
import Models from './pages/Models'
import Alerts from './pages/Alerts'
import SystemPage from './pages/SystemPage'
import Pipeline from './pages/Pipeline'
import PlaceholderPage from './pages/PlaceholderPage'
import CsvAnalyzer from './pages/CsvAnalyzer'

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-shell">
        <Topbar />

        <main className="content">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/live" element={<LiveMonitor />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/models" element={<Models />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/pipeline" element={<Pipeline />} />
            
            <Route
              path="/csv-analyzer"
              element={<CsvAnalyzer />}
            />

            <Route
              path="/data-store"
              element={
                <PlaceholderPage
                  title="Data store"
                  eyebrow="PLATFORM / DATA STORE"
                  description="Inspect the SQL-backed transaction and decision history that supports research reproducibility."
                  dataStore
                />
              }
            />

            <Route path="/system" element={<SystemPage />} />

            <Route
              path="/settings"
              element={
                <PlaceholderPage
                  title="Settings"
                  eyebrow="PLATFORM / SETTINGS"
                  description="Research configuration, model thresholds, stream controls, and API preferences will live here."
                />
              }
            />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}