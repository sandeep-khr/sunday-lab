import type { Effects } from '../engine/types'
import { COMPONENTS } from '../engine/state'

const LABELS: Record<string, string> = {
  reliability: 'Reliability',
  speed: 'Speed',
  morale: 'Morale',
  debt: 'Tech debt',
  reputation: 'Reputation',
  cash: 'Cash',
}

export default function EffectPills({ effects, unlock }: { effects: Effects; unlock?: string | null }) {
  const entries = Object.entries(effects).filter(([k]) => k in LABELS) as [keyof Effects, number][]
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {entries.map(([k, v]) => (
        <span
          key={k}
          className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] ${
            v >= 0
              ? k === 'debt'
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : k === 'debt'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          }`}
        >
          {LABELS[k]} {v > 0 ? '+' : ''}
          {v}
        </span>
      ))}
      {unlock && COMPONENTS[unlock] && (
        <span className="rounded-sm border border-cyan-glow/50 bg-cyan-glow/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan-200">
          UNLOCKED: {COMPONENTS[unlock].name}
        </span>
      )}
    </div>
  )
}
