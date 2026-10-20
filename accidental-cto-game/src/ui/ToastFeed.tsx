import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from '../engine/store'
import { sfx } from '../engine/sound'

export default function ToastFeed({ active }: { active: boolean }) {
  const chapter = useGame((s) => s.chapter())
  const phase = useGame((s) => s.phase)
  const messages = active && (phase === 'scene' || phase === 'result') ? chapter.ambient ?? [] : []
  const [visible, setVisible] = useState<number[]>([])
  const [paged, setPaged] = useState(false)

  useEffect(() => {
    setVisible([])
    setPaged(false)
    if (messages.length === 0) return
    const timers: ReturnType<typeof setTimeout>[] = []
    messages.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisible((v) => [...v, i])
          if (i === 0 && !paged) {
            sfx.pag()
            setPaged(true)
          }
        }, 1400 + i * 2600),
      )
      timers.push(setTimeout(() => setVisible((v) => v.filter((x) => x !== i)), 1400 + i * 2600 + 7000))
    })
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.join('|')])

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20 flex w-[min(320px,70%)] flex-col gap-2">
      <AnimatePresence>
        {visible.map((i) => (
          <motion.div
            key={`${chapter.id}-${i}`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="rounded-lg border border-edge bg-panel/95 p-2.5 backdrop-blur-sm glow-cyan"
          >
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/30 to-emerald-500/30 font-mono text-[10px] font-bold text-cyan-200">
                {['CEO', 'SRE', 'SUP', 'ENG', 'FIN'][i % 5]}
              </div>
              <div className="min-w-0">
                <div className="font-mono text-[9px] tracking-widest text-slate-500">#incidents · now</div>
                <div className="text-[12px] leading-snug text-slate-200">{messages[i]}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
