import { motion } from 'framer-motion'
import { useGame } from '../engine/store'

export default function SliceEnd() {
  const game = useGame((s) => s.game)
  const newRun = useGame((s) => s.newRun)

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-abyss/85 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-[min(620px,92vw)] rounded-xl panel glow-cyan p-8 text-center">
        <span className="font-mono text-[11px] tracking-[0.4em] text-emerald-400">VERTICAL SLICE COMPLETE</span>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-50">You survived the growth pains.</h2>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-slate-400">
          Kafka hums, the replicas lag (responsibly), and Priya's prices always read true. Ahead lies the Shark Tank spike, the war on performance, Kubernetes, and one very public failover on stage.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 font-mono text-sm">
          <Stat k="MONTHS" v={`${game.month}`} />
          <Stat k="MERCHANTS" v={`${Math.round(game.users)}K`} />
          <Stat k="STACK" v={`${game.unlocked.length}/9`} />
        </div>
        <p className="mt-6 font-mono text-xs tracking-wider text-slate-500">ACTS III–V ARE UNDER CONSTRUCTION</p>
        <button
          onClick={newRun}
          className="mt-7 rounded-lg border border-cyan-glow/60 bg-cyan-glow/10 px-8 py-3 font-mono text-sm font-bold tracking-widest text-cyan-200 transition-all hover:bg-cyan-glow/20 focus:outline-none"
        >
          RUN IT AGAIN →
        </button>
      </motion.div>
    </div>
  )
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-edge bg-panel px-3 py-2">
      <div className="text-[9px] tracking-widest text-slate-500">{k}</div>
      <div className="font-bold text-cyan-300">{v}</div>
    </div>
  )
}
