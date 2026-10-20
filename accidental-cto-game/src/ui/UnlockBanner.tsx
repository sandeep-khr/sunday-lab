import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { COMPONENTS } from '../engine/state'
import { useGame } from '../engine/store'
import { sfx } from '../engine/sound'

export default function UnlockBanner() {
  const lastUnlock = useGame((s) => s.lastUnlock)
  const phase = useGame((s) => s.phase)
  const [show, setShow] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if (lastUnlock && (phase === 'result' || phase === 'quiz')) {
      const meta = COMPONENTS[lastUnlock]
      if (!meta) return
      setName(meta.name)
      setShow(true)
      sfx.unlock()
      const t = setTimeout(() => setShow(false), 2800)
      return () => clearTimeout(t)
    }
  }, [lastUnlock, phase])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30 }}
          className="pointer-events-none fixed left-1/2 top-16 z-40 -translate-x-1/2 overflow-hidden"
        >
          <div className="relative rounded-lg border border-cyan-glow/60 bg-panel/95 px-8 py-3 glow-cyan">
            <motion.div
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-glow/25 to-transparent"
            />
            <div className="text-center">
              <div className="font-mono text-[9px] tracking-[0.4em] text-cyan-300">INFRASTRUCTURE ONLINE</div>
              <div className="mt-0.5 text-lg font-extrabold tracking-wide text-cyan-100">{name.toUpperCase()}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
