import { useState } from 'react'
import { COMPONENTS, ROADMAP, capacityOf, deployCadence, loadOf, monthlyCosts, monthlyRevenue, p95ms } from '../engine/state'
import { useGame } from '../engine/store'
import { isMuted, toggleMute } from '../engine/sound'

function StatBar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? 100 - value : value
  const color = good >= 60 ? 'bg-emerald-400' : good >= 30 ? 'bg-amber-400' : 'bg-rose-500'
  return (
    <div className="flex min-w-[92px] flex-col gap-1">
      <div className="flex justify-between font-mono text-[10px] tracking-widest text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-edge">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function HUD({ onOpenCodex }: { onOpenCodex: () => void }) {
  const game = useGame((s) => s.game)
  const codexUnlocked = useGame((s) => s.codexUnlocked)
  const [mute, setMute] = useState(isMuted())
  const costs = monthlyCosts(game)
  const revenue = monthlyRevenue(game)
  const net = revenue - costs
  const load = Math.round(loadOf(game))
  const cap = capacityOf(game)
  const strain = load / Math.max(cap, 1)

  return (
    <header className="panel z-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-4 py-2">
      <button onClick={onOpenCodex} className="group flex items-center gap-2 text-left" title="Open Codex">
        <svg width="26" height="26" viewBox="0 0 32 32" className="shrink-0">
          <defs>
            <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <path d="M16 2 L28 9 V23 L16 30 L4 23 V9 Z" fill="rgba(34,211,238,0.08)" stroke="url(#logo-g)" strokeWidth="1.6" />
          <path d="M11 12 V20 M21 12 V20 M11 16 H21" stroke="url(#logo-g)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="flex flex-col leading-none">
          <span className="font-mono text-sm font-bold tracking-widest text-cyan-300 group-hover:text-cyan-100">ACCIDENTAL CTO</span>
          <span className="mt-0.5 font-mono text-[8px] tracking-[0.3em] text-slate-500 group-hover:text-cyan-300">SYSTEM DESIGN GAME · CODEX [{codexUnlocked.length}]</span>
        </span>
      </button>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatBar label="RELIABILITY" value={game.reliability} />
        <StatBar label="SPEED" value={game.speed} />
        <StatBar label="MORALE" value={game.morale} />
        <StatBar label="TECH DEBT" value={game.debt} invert />
        <StatBar label="REPUTATION" value={game.reputation} />
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs">
        <Chip label="MERCHANTS" value={`${fmt(game.users)} / cap ${cap}K`} tone={strain > 0.95 ? 'red' : strain > 0.8 ? 'amber' : 'cyan'} />
        <Chip label="P95" value={`${p95ms(game)}ms`} tone={p95ms(game) > 400 ? 'amber' : 'green'} />
        <Chip label="CASH" value={`$${Math.round(game.cash)}K`} tone={game.cash < 20 ? 'red' : 'plain'} />
        <Chip label="NET/MO" value={`${net >= 0 ? '+' : ''}$${net}K`} tone={net >= 0 ? 'green' : 'amber'} />
        <Chip label="DEPLOYS" value={deployCadence(game)} tone="plain" />
        <button
          onClick={() => useGame.setState({ phase: 'title' })}
          title="Back to title screen"
          className="rounded border border-edge px-2 py-1 font-mono text-[10px] text-slate-400 transition-colors hover:border-cyan-glow/50 hover:text-cyan-200 focus:outline-none"
        >
          ⌂ HOME
        </button>
        <button
          onClick={() => setMute(toggleMute())}
          title={mute ? 'Unmute' : 'Mute'}
          className="rounded border border-edge px-2 py-1 font-mono text-[10px] text-slate-400 transition-colors hover:border-cyan-glow/50 hover:text-cyan-200 focus:outline-none"
        >
          {mute ? 'SND OFF' : 'SND ON'}
        </button>
      </div>

      <div className="flex w-full flex-wrap items-center gap-1.5 border-t border-edge pt-1.5">
        <span className="mr-1 font-mono text-[10px] tracking-widest text-slate-500">STACK:</span>
        {Object.entries(COMPONENTS).map(([id, meta]) => {
          const has = game.unlocked.includes(id)
          return (
            <span
              key={id}
              title={meta.blurb}
              className={`rounded-sm border px-1.5 py-0.5 font-mono text-[9px] ${
                has
                  ? meta.cost < 0
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-cyan-glow/40 bg-cyan-glow/10 text-cyan-200'
                  : 'border-edge text-slate-600'
              }`}
            >
              {has ? (meta.cost < 0 ? `${meta.name} ·-$${-meta.cost}K/mo` : `${meta.name} ·$${meta.cost}K`) : '???'}
            </span>
          )
        })}
        <span className="ml-auto hidden font-mono text-[9px] tracking-wider text-slate-600 xl:inline">NEXT: {ROADMAP.join(' → ')}</span>
      </div>
    </header>
  )
}

function Chip({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'green' | 'amber' | 'red' | 'plain' }) {
  const tones: Record<string, string> = {
    cyan: 'text-cyan-300',
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-rose-400 alert-pulse',
    plain: 'text-slate-200',
  }
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[8px] tracking-widest text-slate-500">{label}</span>
      <span className={`text-[11px] font-bold ${tones[tone]}`}>{value}</span>
    </div>
  )
}

function fmt(u: number): string {
  return u >= 1000 ? `${(u / 1000).toFixed(1)}M` : `${Math.round(u)}K`
}
