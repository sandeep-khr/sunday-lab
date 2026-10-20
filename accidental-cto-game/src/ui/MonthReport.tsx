import { motion } from 'framer-motion'
import { useGame } from '../engine/store'
import EffectPills from './EffectPills'

export default function MonthReport() {
  const report = useGame((s) => s.lastReport)
  const proceed = useGame((s) => s.proceedFromReport)
  if (!report) return null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-edge px-5 py-2.5 font-mono text-[10px] tracking-[0.25em] text-slate-500">
        MONTH {report.month} — OPERATIONS REPORT
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
          <Row k="MERCHANTS" v={`${fmt(report.prevUsers)} → ${fmt(report.users)}`} tone="cyan" />
          <Row k="LOAD / CAPACITY" v={`${Math.round(report.load)}K / ${report.capacity}K`} tone={report.load > report.capacity ? 'red' : 'green'} />
          <Row k="REVENUE" v={`+$${report.revenue}K`} tone="green" />
          <Row k="INFRA COSTS" v={`-$${report.costs}K`} tone="amber" />
          <Row k="NET" v={`${report.net >= 0 ? '+' : '-'}$${Math.abs(report.net)}K`} tone={report.net >= 0 ? 'green' : 'red'} />
        </div>

        {report.incidents.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mt-4 space-y-3">
            <div className="font-mono text-[9px] tracking-[0.3em] text-rose-400">INCIDENT REPORTS</div>
            {report.incidents.map((inc) => (
              <div key={inc.id} className={`rounded-lg border p-3.5 ${inc.id === 'elastic-scale' ? 'border-amber-400/40 bg-amber-400/5' : 'border-red-alert/40 bg-red-alert/5 glow-red'}`}>
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-2 w-2 rounded-full alert-pulse ${inc.id === 'elastic-scale' ? 'bg-amber-400' : 'bg-red-alert'}`} />
                  <span className={`font-mono text-[10px] font-bold tracking-widest ${inc.id === 'elastic-scale' ? 'text-amber-300' : 'text-rose-300'}`}>
                    {inc.title.toUpperCase()}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{inc.text}</p>
                {Object.keys(inc.effects).length > 0 && (
                  <div className="mt-2">
                    <EffectPills effects={inc.effects} />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {report.incidents.length === 0 && (
          <p className="mt-4 font-mono text-[11px] tracking-wider text-emerald-400/80">NO INCIDENTS THIS MONTH. THE PAGER STAYED QUIET.</p>
        )}
      </div>
      <button
        onClick={proceed}
        className="w-full border-t border-edge bg-panel-2 py-3 font-mono text-sm font-bold tracking-widest text-cyan-300 transition-colors hover:bg-cyan-glow/10 focus:outline-none"
      >
        NEXT MONTH →
      </button>
    </div>
  )
}

function Row({ k, v, tone }: { k: string; v: string; tone: 'cyan' | 'green' | 'amber' | 'red' }) {
  const tones = { cyan: 'text-cyan-300', green: 'text-emerald-400', amber: 'text-amber-400', red: 'text-rose-400' }
  return (
    <div className="rounded-md border border-edge bg-panel px-2.5 py-1.5">
      <div className="text-[8px] tracking-widest text-slate-500">{k}</div>
      <div className={`font-bold ${tones[tone]}`}>{v}</div>
    </div>
  )
}

function fmt(u: number): string {
  return u >= 1000 ? `${(u / 1000).toFixed(1)}M` : `${Math.round(u)}K`
}
