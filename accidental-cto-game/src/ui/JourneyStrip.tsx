import { capacityOf, loadOf } from '../engine/state'
import { useGame } from '../engine/store'

const MILESTONES = [
  { at: 1, label: '1K', stage: 'One box does everything' },
  { at: 10, label: '10K', stage: 'Split app & DB, balance traffic' },
  { at: 50, label: '50K', stage: 'Cache hot reads, queue orders' },
  { at: 150, label: '150K', stage: 'Containers, search, CDN' },
  { at: 400, label: '400K', stage: 'Kubernetes + edge regions' },
  { at: 800, label: '800K', stage: 'Own economics · global failover' },
]

export default function JourneyStrip() {
  const game = useGame((s) => s.game)
  const users = game.users
  const strain = loadOf(game) / Math.max(capacityOf(game), 1)
  const nextIdx = MILESTONES.findIndex((m) => users < m.at)
  const next = nextIdx === -1 ? null : MILESTONES[nextIdx]
  const pct = Math.min(100, (Math.log10(Math.max(users, 1)) / Math.log10(1000)) * 100)

  return (
    <div className="border-b border-edge px-4 pb-2 pt-1.5">
      <div className="mb-1 flex items-center justify-between font-mono text-[9px] tracking-[0.25em] text-slate-500">
        <span>SCALING JOURNEY</span>
        <span className="text-slate-600">{strain > 0.95 ? 'AT CAPACITY — SCALE INFRA TO GROW' : `${Math.round(strain * 100)}% CAPACITY USED`}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-edge">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: `${pct}%` }} />
        {MILESTONES.map((m) => {
          const left = (Math.log10(m.at) / Math.log10(1000)) * 100
          const passed = users >= m.at
          return (
            <div
              key={m.label}
              title={`${m.label} merchants: ${m.stage}`}
              className={`absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
                passed ? 'border-emerald-300 bg-emerald-400' : 'border-slate-600 bg-panel'
              }`}
              style={{ left: `${left}%` }}
            />
          )
        })}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[8px] tracking-widest text-slate-600">
        <span>0</span>
        <span>1K</span>
        <span>10K</span>
        <span>100K</span>
        <span>1M+</span>
      </div>
      {next && (
        <div className="mt-0.5 font-mono text-[9px] leading-tight tracking-wide text-amber-400/80">
          NEXT MILESTONE {next.label}: {next.stage.toUpperCase()}
        </div>
      )}
    </div>
  )
}
