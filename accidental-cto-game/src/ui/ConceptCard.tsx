import { AnimatePresence, motion } from 'framer-motion'
import { CODEX } from '../engine/codex'
import { useGame } from '../engine/store'

const COMP_TO_CODEX: Record<string, string> = {
  monitoring: 'monitoring',
  mvp: 'mvp',
  db_split: 'db_split',
  lb: 'lb',
  replicas: 'replicas',
  staging: 'staging',
  redis: 'caching',
  microservice: 'strangler',
  kafka: 'kafka',
  docker: 'docker',
  es: 'search',
  cdn: 'cdn',
  k8s: 'k8s',
  edge: 'edge',
  bare_metal: 'cloud_econ',
  enterprise: 'sla',
  cicd: 'cicd',
}

export default function ConceptCard() {
  const conceptOpen = useGame((s) => s.conceptOpen)
  const openConcept = useGame((s) => s.openConcept)
  const entry = conceptOpen ? CODEX[COMP_TO_CODEX[conceptOpen] ?? conceptOpen] : null

  return (
    <AnimatePresence>
      {entry && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="absolute bottom-3 left-3 z-20 w-[min(400px,90%)] rounded-xl panel glow-cyan p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="font-mono text-[9px] tracking-[0.25em] text-cyan-300">{entry.tag.toUpperCase()}</span>
              <h4 className="text-base font-bold text-slate-50">{entry.term}</h4>
            </div>
            <button onClick={() => openConcept(null)} className="rounded border border-edge px-2 py-0.5 font-mono text-[10px] text-slate-500 hover:border-cyan-glow/50 hover:text-cyan-200">
              ✕
            </button>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-300">{entry.definition}</p>
          {entry.analogy && <p className="mt-2 border-l-2 border-amber-400/60 pl-2.5 text-xs italic leading-relaxed text-amber-100/80">{entry.analogy}</p>}
          <ul className="mt-2 space-y-1">
            {entry.points.map((p, i) => (
              <li key={i} className="flex gap-1.5 text-[11px] leading-snug text-slate-400">
                <span className="text-cyan-glow">▸</span>
                {p}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
