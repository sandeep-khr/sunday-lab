import { motion } from 'framer-motion'
import { useGame } from '../engine/store'
import { sfx } from '../engine/sound'
import EffectPills from './EffectPills'
import InvestigationPanel from './InvestigationPanel'

export default function DecisionCard() {
  const chapter = useGame((s) => s.chapter())
  const sceneIndex = useGame((s) => s.game.sceneIndex)
  const totalScenes = chapter.scenes.length
  const choose = useGame((s) => s.choose)
  const hoverUnlock = useGame((s) => s.hoverUnlock)
  const scene = chapter.scenes[sceneIndex]

  if (scene.kind === 'investigation' || scene.investigation) return <InvestigationPanel />

  if (!scene.choices || !scene.prompt) return null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-edge px-5 py-2">
        <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500">
          ACT {chapter.act} · CH {chapter.num} · DECISION {sceneIndex + 1}/{totalScenes}
        </span>
        <span className="font-mono text-[9px] tracking-widest text-amber-400 alert-pulse">CTO DECISION</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {chapter.ambient && (
          <div className="mb-4 space-y-1.5">
            {chapter.ambient.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="rounded-md rounded-bl-none border border-edge bg-panel px-3 py-1.5 font-mono text-[10px] leading-snug text-slate-400"
              >
                <span className="mr-1.5 text-cyan-300">#incidents</span>
                {msg}
              </motion.div>
            ))}
          </div>
        )}
        <p className="mb-4 text-[15px] leading-snug font-semibold text-slate-100">{scene.prompt}</p>
        <div className="flex flex-col gap-2.5">
          {scene.choices.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onMouseEnter={() => hoverUnlock(c.unlock ?? null)}
              onMouseLeave={() => hoverUnlock(null)}
              onClick={() => {
                sfx.click()
                hoverUnlock(null)
                choose(i)
              }}
              className="group rounded-lg border border-edge bg-panel-2/70 px-3.5 py-2.5 text-left transition-all hover:border-cyan-glow/60 hover:bg-panel-2 hover:shadow-[0_0_16px_rgba(34,211,238,0.15)] focus:outline-none focus-visible:border-cyan-glow"
            >
              <div className="text-sm font-semibold text-slate-100 group-hover:text-cyan-200">{c.label}</div>
              <div className="mt-0.5 text-xs leading-snug text-slate-400">{c.detail}</div>
              <div className="mt-1.5 opacity-60 transition-opacity group-hover:opacity-100">
                <EffectPills effects={c.effects} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
