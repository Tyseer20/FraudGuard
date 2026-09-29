import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight, Target, TrendingUp } from 'lucide-react'
import SectionHeader from '../components/SectionHeader'
import { modelMetrics } from '../lib/mockData'

const data = modelMetrics.map((m) => ({ name: m.name.replace(' ', '\n'), Accuracy: m.accuracy, Precision: m.precision, Recall: m.recall, F1: m.f1 }))

export default function Analytics() {
  return <div className="page-stack"><SectionHeader eyebrow="ANALYTICS / PERFORMANCE" title="Detection analytics" description="Compare model behavior and operational fraud outcomes using the metrics that matter for an imbalanced classification problem." action={<button className="ghost-button">Last 24 hours <ArrowUpRight size={15} /></button>} />
    <div className="three-grid"><section className="panel insight-card"><div className="insight-icon"><Target size={19}/></div><span>Ensemble precision</span><strong>96.4%</strong><small>+4.6 pts vs logistic baseline</small></section><section className="panel insight-card"><div className="insight-icon"><TrendingUp size={19}/></div><span>Ensemble recall</span><strong>94.8%</strong><small>Captures the majority of confirmed fraud</small></section><section className="panel insight-card"><div className="insight-icon"><ArrowUpRight size={19}/></div><span>ROC-AUC</span><strong>99.5%</strong><small>Strong ranking separation in test split</small></section></div>
    <section className="panel chart-panel"><div className="panel-heading"><div><div className="eyebrow">MODEL BENCHMARK</div><h2>Individual vs ensemble</h2></div><span className="count-pill">Research view</span></div><div className="chart-box benchmark-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 14, right: 20, left: -18, bottom: 20 }}><CartesianGrid stroke="var(--grid)" vertical={false}/><XAxis dataKey="name" interval={0} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis domain={[70,100]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: 'var(--panel-strong)', border: '1px solid var(--border)', borderRadius: 14 }}/><Legend/><Bar dataKey="Accuracy" fill="#8b7cff" radius={[6,6,0,0]} /><Bar dataKey="Precision" fill="#35d6b0" radius={[6,6,0,0]} /><Bar dataKey="Recall" fill="#f59e0b" radius={[6,6,0,0]} /><Bar dataKey="F1" fill="#60a5fa" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div></section>
  </div>
}
