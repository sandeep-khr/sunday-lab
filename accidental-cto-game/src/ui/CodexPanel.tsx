import { motion } from 'framer-motion'
import { CODEX } from '../engine/codex'
import { useGame } from '../engine/store'

export default function CodexPanel({ onClose }: { onClose: () => void }) {
  const unlocked = useGame((s) => s.codexUnlocked)
  const entries = Object.values(CODEX)
  const known = entries.filter((e) => unlocked.includes(e.id))
  const locked = entries.filter((e) => !unlocked.includes(e.id))

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-abyss/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="panel glow-cyan flex max-h-[88%] w-[min(780px,94vw)] flex-col overflow-hidden rounded-xl"
      >
        <div className="flex items-center justify-between border-b border-edge px-5 py-3">
          <div>
            <span className="font-mono text-sm font-bold tracking-widest text-cyan-300">CODEX</span>
            <span className="ml-3 font-mono text-[10px] tracking-wider text-slate-500">
              {known.length}/{entries.length} CONCEPTS LEARNED
            </span>
          </div>
          <button onClick={onClose} className="rounded border border-edge px-3 py-1 font-mono text-xs text-slate-400 hover:border-cyan-glow/50 hover:text-cyan-200">
            ESC
          </button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5 md:grid-cols-2">
          {[...known, ...locked].map((e) => {
            const isKnown = unlocked.includes(e.id)
            return (
              <div key={e.id} className={`rounded-lg border p-4 ${isKnown ? 'border-edge bg-panel-2/70' : 'border-dashed border-edge opacity-45'}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-slate-100">{isKnown ? e.term : '???'}</span>
                  <span className="font-mono text-[9px] tracking-widest text-cyan-300/70">{isKnown ? e.tag.toUpperCase() : 'UNDISCOVERED'}</span>
                </div>
                {isKnown && (
                  <>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">{e.definition}</p>
                    {e.analogy && <p className="mt-2 border-l-2 border-amber-400/60 pl-3 text-[13px] italic leading-relaxed text-amber-100/80">{e.analogy}</p>}
                    <ul className="mt-2 space-y-1">
                      {e.points.map((p, i) => (
                        <li key={i} className="flex gap-2 text-[12px] leading-snug text-slate-400">
                          <span className="text-cyan-glow">▸</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
