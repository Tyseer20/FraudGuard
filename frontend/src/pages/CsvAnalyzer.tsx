import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { useRef, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import StatusBadge from '../components/StatusBadge'

type CsvRowResult = {
  row: number
  prediction: number
  is_fraud: boolean
  fraud_probability: number
  fraud_score_percent: number
  risk: 'Low' | 'Medium' | 'High' | 'Critical'
  decision: 'APPROVE' | 'REVIEW' | 'BLOCK'
  model: string
  actual_label: number | null
}

type CsvEvaluation = {
  labeled_rows: number
  accuracy: number
  precision: number
  recall: number
  f1: number
  true_positive: number
  true_negative: number
  false_positive: number
  false_negative: number
}

type CsvAnalysisResponse = {
  filename: string
  rows: number
  columns: string[]
  column_count: number
  mode: string
  model: string
  feature_space: string[]
  label_column: string | null
  summary: {
    total: number
    suspicious: number
    suspicious_rate: number
    blocked: number
    review: number
    approved: number
  }
  evaluation: CsvEvaluation | null
  suspicious_transactions: CsvRowResult[]
  preview: CsvRowResult[]
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:8000'

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`
}

function getRiskClass(risk: string) {
  return risk.toLowerCase()
}

export default function CsvAnalyzer() {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(
    null,
  )
  const [result, setResult] =
    useState<CsvAnalysisResponse | null>(
      null,
    )
  const [loading, setLoading] =
    useState(false)
  const [error, setError] =
    useState<string | null>(null)

  async function analyzeFile() {
    if (!file) {
      setError(
        'Please select a CSV file first.',
      )
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()

      formData.append(
        'file',
        file,
      )

      const response = await fetch(
        `${API_BASE}/api/csv/analyze`,
        {
          method: 'POST',
          body: formData,
        },
      )

      if (!response.ok) {
        const text =
          await response.text()

        throw new Error(
          text ||
            `Analysis failed: ${response.status}`,
        )
      }

      const data =
        (await response.json()) as CsvAnalysisResponse

      setResult(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'CSV analysis failed.',
      )
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="page-stack">
      <SectionHeader
        eyebrow="FRAUD INTELLIGENCE / BATCH ANALYSIS"
        title="CSV fraud investigator"
        description="Upload a transaction dataset and let FraudGuard automatically select the appropriate analysis strategy."
        action={
          <button
            className="ghost-button"
            onClick={reset}
          >
            <RefreshCw size={15} />
            Reset
          </button>
        }
      />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">
              DATA INGESTION
            </div>
            <h2>Upload transaction CSV</h2>
          </div>

          <FileSpreadsheet
            size={22}
          />
        </div>

        <div
          style={{
            border:
              '1px dashed var(--border)',
            borderRadius: 18,
            padding: 32,
            textAlign: 'center',
            background:
              'var(--panel-strong)',
          }}
        >
          <Upload
            size={32}
            style={{
              marginBottom: 12,
            }}
          />

          <h3
            style={{
              margin: 0,
            }}
          >
            {file
              ? file.name
              : 'Choose a CSV file'}
          </h3>

          <p
            style={{
              color: 'var(--muted)',
              margin:
                '8px 0 20px',
            }}
          >
            FraudGuard first checks whether
            the file matches the trained
            credit-card feature space.
            Otherwise it performs generic
            anomaly detection.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(event) => {
              const selected =
                event.target.files?.[0] ??
                null

              setFile(selected)
              setResult(null)
              setError(null)
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent:
                'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button
              className="ghost-button"
              onClick={() =>
                inputRef.current?.click()
              }
            >
              <FileSpreadsheet
                size={15}
              />
              Choose CSV
            </button>

            <button
              className="primary-button"
              disabled={
                !file || loading
              }
              onClick={analyzeFile}
            >
              {loading ? (
                <>
                  <RefreshCw
                    size={15}
                    className="spin"
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3
                    size={15}
                  />
                  Analyze CSV
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: 14,
              border:
                '1px solid rgba(239,68,68,.35)',
              background:
                'rgba(239,68,68,.08)',
            }}
          >
            <strong>
              Analysis failed
            </strong>

            <p
              style={{
                margin:
                  '6px 0 0',
                color: 'var(--muted)',
              }}
            >
              {error}
            </p>
          </div>
        )}
      </section>

      {result && (
        <>
          <div className="kpi-grid">
            <div className="panel compact-panel">
              <div className="eyebrow">
                TRANSACTIONS
              </div>
              <h2>
                {result.summary.total.toLocaleString()}
              </h2>
              <p>Rows analyzed</p>
            </div>

            <div className="panel compact-panel">
              <div className="eyebrow">
                SUSPICIOUS
              </div>
              <h2>
                {result.summary.suspicious.toLocaleString()}
              </h2>
              <p>
                {formatPercent(
                  result.summary
                    .suspicious_rate,
                )}{' '}
                of uploaded rows
              </p>
            </div>

            <div className="panel compact-panel">
              <div className="eyebrow">
                REVIEW
              </div>
              <h2>
                {result.summary.review.toLocaleString()}
              </h2>
              <p>
                Transactions requiring
                investigation
              </p>
            </div>

            <div className="panel compact-panel">
              <div className="eyebrow">
                BLOCKED
              </div>
              <h2>
                {result.summary.blocked.toLocaleString()}
              </h2>
              <p>
                Transactions classified
                for blocking
              </p>
            </div>
          </div>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">
                  ANALYSIS ENGINE
                </div>
                <h2>
                  {result.model}
                </h2>
              </div>

              <StatusBadge
                status={
                  result.mode ===
                  'supervised_ensemble'
                    ? 'Healthy'
                    : 'Active'
                }
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
              }}
            >
              <div>
                <span>Analysis mode</span>
                <strong
                  style={{
                    display:
                      'block',
                    marginTop: 6,
                  }}
                >
                  {result.mode ===
                  'supervised_ensemble'
                    ? 'Trained ensemble'
                    : 'Generic anomaly detection'}
                </strong>
              </div>

              <div>
                <span>Columns</span>
                <strong
                  style={{
                    display:
                      'block',
                    marginTop: 6,
                  }}
                >
                  {result.column_count}
                </strong>
              </div>

              <div>
                <span>Fraud label</span>
                <strong
                  style={{
                    display:
                      'block',
                    marginTop: 6,
                  }}
                >
                  {result.label_column ??
                    'Not detected'}
                </strong>
              </div>

              <div>
                <span>Features used</span>
                <strong
                  style={{
                    display:
                      'block',
                    marginTop: 6,
                  }}
                >
                  {result.feature_space.length}
                </strong>
              </div>
            </div>
          </section>

          {result.evaluation && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">
                    VALIDATION
                  </div>
                  <h2>
                    Comparison with uploaded labels
                  </h2>
                </div>
              </div>

              <div className="three-grid">
                <div className="mini-stat">
                  <div className="mini-stat-icon">
                    <ShieldCheck size={16} />
                  </div>

                  <div>
                    <span>
                      Accuracy
                    </span>

                    <strong>
                      {formatPercent(
                        result.evaluation
                          .accuracy *
                          100,
                      )}
                    </strong>
                  </div>
                </div>

                <div className="mini-stat">
                  <div className="mini-stat-icon">
                    <ShieldAlert size={16} />
                  </div>

                  <div>
                    <span>
                      Precision
                    </span>

                    <strong>
                      {formatPercent(
                        result.evaluation
                          .precision *
                          100,
                      )}
                    </strong>
                  </div>
                </div>

                <div className="mini-stat">
                  <div className="mini-stat-icon">
                    <AlertTriangle size={16} />
                  </div>

                  <div>
                    <span>
                      Recall
                    </span>

                    <strong>
                      {formatPercent(
                        result.evaluation
                          .recall *
                          100,
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  color: 'var(--muted)',
                }}
              >
                Labeled rows:{' '}
                {result.evaluation
                  .labeled_rows.toLocaleString()}
                {' · '}
                F1:{' '}
                {formatPercent(
                  result.evaluation
                    .f1 * 100,
                )}
                {' · '}
                TP:{' '}
                {result.evaluation
                  .true_positive}
                {' · '}
                FP:{' '}
                {result.evaluation
                  .false_positive}
                {' · '}
                FN:{' '}
                {result.evaluation
                  .false_negative}
              </div>
            </section>
          )}

          <section className="panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">
                  FRAUD QUEUE
                </div>

                <h2>
                  Suspicious transactions
                </h2>
              </div>

              <span className="count-pill">
                {result.summary.suspicious}{' '}
                detected
              </span>
            </div>

            {result.suspicious_transactions
              .length === 0 ? (
              <div
                style={{
                  padding: 30,
                  textAlign:
                    'center',
                  color: 'var(--muted)',
                }}
              >
                <CheckCircle2
                  size={30}
                />
                <p>
                  No suspicious
                  transactions were
                  detected.
                </p>
              </div>
            ) : (
              <div
                style={{
                  overflowX:
                    'auto',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse:
                      'collapse',
                  }}
                >
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Fraud score</th>
                      <th>Risk</th>
                      <th>Decision</th>
                      <th>Model</th>
                      <th>Actual label</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.suspicious_transactions
                      .slice(0, 100)
                      .map((row) => (
                        <tr
                          key={
                            row.row
                          }
                        >
                          <td>
                            #{row.row}
                          </td>

                          <td>
                            <strong>
                              {formatPercent(
                                row.fraud_score_percent,
                              )}
                            </strong>
                          </td>

                          <td>
                            <StatusBadge
                              risk={
                                row.risk
                              }
                            />
                          </td>

                          <td>
                            <strong>
                              {
                                row.decision
                              }
                            </strong>
                          </td>

                          <td>
                            {row.model}
                          </td>

                          <td>
                            {row.actual_label ===
                            null
                              ? '—'
                              : row.actual_label ===
                                1
                              ? 'Fraud'
                              : 'Legitimate'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">
                  DATA PROFILE
                </div>
                <h2>
                  Uploaded schema
                </h2>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {result.columns.map(
                (column) => (
                  <span
                    key={column}
                    className="count-pill"
                  >
                    {column}
                  </span>
                ),
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}