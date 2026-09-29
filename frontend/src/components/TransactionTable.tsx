import { ArrowUpRight } from 'lucide-react'
import { transactions as mockTransactions } from '../lib/mockData'
import type { StoredTransaction } from '../lib/api'
import StatusBadge from './StatusBadge'

type TableRow = {
  id: string
  time: string
  merchant: string
  country: string
  amount: number
  risk: 'Low' | 'Medium' | 'High' | 'Critical'
  score: number
  status: 'Approved' | 'Blocked' | 'Review'
}

function fromStored(tx: StoredTransaction): TableRow {
  return {
    id: `TX-${tx.id}`,
    time: tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--',
    merchant: tx.source === 'transaction-analyzer' ? 'FraudGuard Analyzer' : 'Research Dataset',
    country: '—',
    amount: tx.amount,
    risk: tx.risk,
    score: tx.fraud_score_percent,
    status: tx.decision === 'BLOCK' ? 'Blocked' : tx.decision === 'REVIEW' ? 'Review' : 'Approved',
  }
}

export default function TransactionTable({ compact = false, rows = [] }: { compact?: boolean; rows?: StoredTransaction[] }) {
  const sourceRows = rows.length ? rows.map(fromStored) : mockTransactions
  const displayRows = compact ? sourceRows.slice(0, 5) : sourceRows

  return (
    <div className="table-wrap">
      {rows.length === 0 ? (
        <div className="db-empty-state">
          <strong>No persisted transactions yet</strong>
          <span>Analyze a transaction to write the prediction, risk score, and decision into SQL.</span>
        </div>
      ) : null}
      <table className="data-table">
        <thead>
          <tr>
            <th>Transaction</th><th>Time</th><th>Source</th><th>Amount</th><th>Risk</th><th>Score</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((tx) => (
            <tr key={tx.id}>
              <td><span className="mono">{tx.id}</span></td>
              <td className="muted-cell">{tx.time}</td>
              <td><div className="merchant-cell"><span className="merchant-avatar">{tx.merchant.slice(0, 1)}</span><div><strong>{tx.merchant}</strong><small>{tx.country}</small></div></div></td>
              <td><strong>${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
              <td><StatusBadge risk={tx.risk} /></td>
              <td><div className="score-cell"><div className="score-track"><div className={`score-fill ${tx.risk.toLowerCase()}`} style={{ width: `${Math.max(tx.score, 4)}%` }} /></div><span>{tx.score.toFixed(2)}%</span></div></td>
              <td><StatusBadge status={tx.status} /></td>
              <td><button className="row-action" aria-label={`Open ${tx.id}`}><ArrowUpRight size={15} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
