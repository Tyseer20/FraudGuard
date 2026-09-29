import { CheckCircle2, CircleDashed } from 'lucide-react'

export default function EmptySystemPanel({ title, copy, connected = false }: { title: string; copy: string; connected?: boolean }) {
  return (
    <section className="panel empty-panel">
      <div className="empty-icon">{connected ? <CheckCircle2 size={26} /> : <CircleDashed size={26} />}</div>
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
      </div>
    </section>
  )
}
