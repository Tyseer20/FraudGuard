import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import TransactionTable from '../components/TransactionTable'
import { getDemoSample, getTransactions, predictTransaction, type PredictionResponse, type StoredTransaction } from '../lib/api'
import { useEffect } from 'react'

const featureGroups = [
  { label: 'Transaction context', features: ['Time', 'Amount'] },
  { label: 'Principal components', features: Array.from({ length: 28 }, (_, i) => `V${i + 1}`) },
]

const initialFeatures = Object.fromEntries(['Time', ...Array.from({ length: 28 }, (_, i) => `V${i + 1}`), 'Amount'].map((name) => [name, 0]))

function formatFeature(value: number) {
  return Number.isFinite(value) ? String(value) : '0'
}

export default function Transactions() {
  const [query, setQuery] = useState('')
  const [features, setFeatures] = useState<Record<string, number>>(initialFeatures)
  const [result, setResult] = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [sampleLoading, setSampleLoading] = useState(false)
  const [sampleLabel, setSampleLabel] = useState<'Legitimate' | 'Fraud' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [storedTransactions, setStoredTransactions] = useState<StoredTransaction[]>([])
  const [dbLoading, setDbLoading] = useState(false)

  useEffect(() => {
    void loadSample(false)
    void refreshTransactions()
  }, [])

  async function refreshTransactions(search = query) {
    setDbLoading(true)
    try {
      const response = await getTransactions(search)
      setStoredTransactions(response.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load SQL transaction history')
    } finally {
      setDbLoading(false)
    }
  }

  async function loadSample(fraud: boolean) {
    setSampleLoading(true)
    setError(null)
    setResult(null)
    try {
      const sample = await getDemoSample(fraud)
      setFeatures(sample.features)
      setSampleLabel(fraud ? 'Fraud' : 'Legitimate')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load sample transaction')
    } finally {
      setSampleLoading(false)
    }
  }

  function updateFeature(name: string, value: string) {
    const parsed = Number(value)
    setFeatures((current) => ({ ...current, [name]: Number.isFinite(parsed) ? parsed : 0 }))
  }

  async function analyze() {
    setLoading(true)
    setError(null)
    try {
      const prediction = await predictTransaction(features, sampleLabel === 'Fraud' ? 1 : sampleLabel === 'Legitimate' ? 0 : null)
      setResult(prediction)
      await refreshTransactions('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = result?.risk === 'Critical' || result?.risk === 'High' ? 'risk-high' : result?.risk === 'Medium' ? 'risk-medium' : 'risk-low'
  const modelEntries = useMemo(() => Object.entries(result?.model_probabilities ?? {}), [result])

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="MONITORING / TRANSACTIONS"
        title="Transaction explorer"
        description="Investigate transaction-level signals and run live inference against the trained FraudGuard ensemble. Demo samples come directly from the research dataset."
        action={<button className="ghost-button"><Download size={16} /> Export</button>}
      />

      <section className="panel analyzer-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">LIVE INFERENCE</div>
            <h2>Transaction analyzer</h2>
            <p className="panel-subtitle">Send the exact feature vector expected by the trained ensemble through the FastAPI prediction service.</p>
          </div>
          <span className="count-pill"><Activity size={12} /> Model: Ensemble</span>
        </div>

        <div className="sample-actions">
          <button className="primary-button" onClick={() => void loadSample(false)} disabled={sampleLoading}>
            {sampleLoading ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />} Load legitimate sample
          </button>
          <button className="ghost-button" onClick={() => void loadSample(true)} disabled={sampleLoading}>
            <ShieldAlert size={14} /> Load fraud sample
          </button>
          <button className="ghost-button" onClick={() => { setFeatures(initialFeatures); setResult(null); setSampleLabel(null); setError(null) }}>
            <RefreshCw size={14} /> Reset
          </button>
          {sampleLabel && <span className="sample-note">Dataset sample: {sampleLabel}</span>}
        </div>

        <div className="feature-groups">
          {featureGroups.map((group) => (
            <div className="feature-group" key={group.label}>
              <div className="feature-group-title"><span>{group.label}</span><small>{group.features.length} fields</small></div>
              <div className="feature-grid">
                {group.features.map((feature) => (
                  <label className="feature-field" key={feature}>
                    <span>{feature}</span>
                    <input value={formatFeature(features[feature] ?? 0)} onChange={(e) => updateFeature(feature, e.target.value)} inputMode="decimal" />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="analyzer-footer">
          <div className="analysis-note"><Sparkles size={15} /><div><strong>Research-safe inference</strong><span>Prediction output is an application inference result; it is not used as a replacement for the model evaluation metrics reported on the Models page.</span></div></div>
          <button className="primary-button" onClick={() => void analyze()} disabled={loading}>{loading ? <Loader2 size={15} className="spin" /> : <ShieldAlert size={15} />} Analyze transaction</button>
        </div>

        {error && <div className="error-banner"><XCircle size={16} /><span>{error}</span></div>}

        {result && (
          <div className="prediction-result">
            <div className={`decision-hero ${scoreColor}`}>
              <div className="decision-icon">{result.is_fraud ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}</div>
              <div><small>ENSEMBLE DECISION</small><strong>{result.decision}</strong><span>{result.risk} risk · {result.fraud_score_percent.toFixed(2)}% fraud probability</span></div>
            </div>
            <div className="prediction-metrics">
              <div><span>Fraud probability</span><strong>{result.fraud_score_percent.toFixed(2)}%</strong></div>
              <div><span>Prediction</span><strong>{result.is_fraud ? 'Fraud' : 'Legitimate'}</strong></div>
              <div><span>Risk tier</span><strong>{result.risk}</strong></div>
              <div><span>Inference model</span><strong>{result.model}</strong></div>
            </div>
            <div className="model-consensus">
              <div className="panel-heading"><div><div className="eyebrow">MODEL CONSENSUS</div><h2>Classifier probabilities</h2></div></div>
              <div className="consensus-grid">
                {modelEntries.map(([name, probability]) => (
                  <div className="consensus-item" key={name}><div><span>{name}</span><strong>{probability.toFixed(2)}%</strong></div><div className="progress"><span style={{ width: `${Math.min(probability, 100)}%` }} /></div></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="panel table-panel">
        <div className="filter-bar">
          <div className="search-input"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void refreshTransactions(e.currentTarget.value) }} placeholder="Search transaction ID, decision or risk" /></div>
          <button className="filter-button"><SlidersHorizontal size={15} /> Advanced filters</button>
        </div>
        <TransactionTable rows={storedTransactions} />
        <div className="table-pagination"><span>{dbLoading ? 'Loading SQL transaction history…' : `Showing ${storedTransactions.length} persisted transactions`}</span><div><button className="page-button">Previous</button><button className="page-button active">1</button><button className="page-button">2</button><button className="page-button">3</button><button className="page-button">Next</button></div></div>
      </section>
    </div>
  )
}
