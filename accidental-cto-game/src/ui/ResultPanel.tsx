import { motion } from 'framer-motion'
import { useGame } from '../engine/store'
import EffectPills from './EffectPills'

export default function ResultPanel() {
  const lastChoice = useGame((s) => s.lastChoice)
  const lastEffects = useGame((s) => s.lastEffects)
  const lastUnlock = useGame((s) => s.lastUnlock)
  const continueResult = useGame((s) => s.continueResult)
  if (!lastChoice || !lastEffects) return null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-edge px-5 py-2.5 font-mono text-[10px] tracking-[0.25em] text-slate-500">OUTCOME</div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <p className="text-[15px] leading-relaxed text-slate-100">{lastChoice.result}</p>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-4">
          <EffectPills effects={lastEffects} unlock={lastUnlock} />
        </motion.div>

        {lastChoice.deepDive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-5 rounded-lg border border-cyan-glow/30 bg-cyan-glow/5 p-4"
          >
            <span className="font-mono text-[10px] tracking-[0.25em] text-cyan-300">HOW IT WORKS</span>
            <p className="mt-1 font-semibold text-cyan-100">{lastChoice.deepDive.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{lastChoice.deepDive.body}</p>
          </motion.div>
        )}

        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
          className="mt-5 rounded-r-md border-l-2 border-amber-400/80 bg-amber-400/5 px-4 py-3"
        >
          <span className="font-mono text-[10px] tracking-[0.25em] text-amber-400">THE BOOK SAYS</span>
          <p className="mt-1 italic leading-relaxed text-amber-100/90">“{lastChoice.lesson}”</p>
        </motion.blockquote>
      </div>

      <button
        onClick={continueResult}
        className="w-full border-t border-edge bg-panel-2 py-3 font-mono text-sm font-bold tracking-widest text-cyan-300 transition-colors hover:bg-cyan-glow/10 focus:outline-none"
      >
        CONTINUE →
      </button>
    </div>
  )
}
