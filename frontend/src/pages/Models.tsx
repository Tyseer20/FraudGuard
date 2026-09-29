import { useEffect, useState } from 'react'
import { BrainCircuit, CheckCircle2, Code2, Layers3 } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import { getModelMetrics, type ApiModelMetric } from '../lib/api'

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export default function Models() {
  const [models, setModels] = useState<ApiModelMetric[]>([])
  const [dataset, setDataset] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getModelMetrics()
      .then((data) => {
        setModels(data.models)
        setDataset(data.dataset)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load model metrics'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-stack">
      <SectionHeader eyebrow="ML / ENSEMBLE" title="Model laboratory" description="Live evaluation results from the trained fraud-detection models used by FraudGuard." action={<button className="primary-button"><Code2 size={16} /> Train experiment</button>} />

      {loading && <section className="panel"><div className="eyebrow">LOADING</div><h2>Loading trained model metrics…</h2></section>}
      {error && <section className="panel"><div className="eyebrow">MODEL API</div><h2>Metrics unavailable</h2><p>{error}</p></section>}

      {!loading && !error && <>
        <section className="panel compact-panel">
          <div className="panel-heading"><div><div className="eyebrow">EXPERIMENT DATASET</div><h2>{dataset}</h2></div><span className="count-pill">{models.length} models</span></div>
          <p>These values are loaded directly from the completed training run and will become the research results used later in the paper.</p>
        </section>

        <div className="model-grid">
          {models.map((m) => <section className={`panel model-card ${m.model === 'Ensemble' ? 'featured' : ''}`} key={m.model}>
            <div className="model-card-head"><div className="model-badge">{m.model === 'Ensemble' ? <Layers3 size={19}/> : <BrainCircuit size={19}/>}</div><div><h3>{m.model}</h3><span>{m.model === 'Ensemble' ? 'Soft-voting decision layer' : 'Individual classifier'}</span></div>{m.model === 'Ensemble' && <span className="model-ribbon">ACTIVE</span>}</div>
            <div className="model-primary"><span>Accuracy</span><strong>{pct(m.accuracy)}</strong><div className="progress"><div style={{ width: `${m.accuracy * 100}%` }}/></div></div>
            <div className="metric-grid">{[['Precision',m.precision],['Recall',m.recall],['F1',m.f1],['ROC-AUC',m.roc_auc]].map(([label,value])=><div key={label as string}><span>{label}</span><strong>{pct(value as number)}</strong></div>)}</div>
            <div className="model-card-footer"><span><CheckCircle2 size={14}/> Real evaluation result</span><small>{m.training_seconds.toFixed(2)}s</small></div>
          </section>)}
        </div>
      </>}

      <section className="panel ensemble-panel"><div className="panel-heading"><div><div className="eyebrow">ARCHITECTURE</div><h2>Soft-voting ensemble</h2></div></div><div className="ensemble-flow"><div className="flow-box"><BrainCircuit size={20}/><span>Logistic Regression</span><small>Probability</small></div><div className="flow-plus">+</div><div className="flow-box"><BrainCircuit size={20}/><span>Random Forest</span><small>Probability</small></div><div className="flow-plus">+</div><div className="flow-box"><BrainCircuit size={20}/><span>XGBoost</span><small>Probability</small></div><div className="flow-arrow">→</div><div className="flow-box final"><Layers3 size={20}/><span>Ensemble</span><small>Weighted probability</small></div></div></section>
    </div>
  )
}
