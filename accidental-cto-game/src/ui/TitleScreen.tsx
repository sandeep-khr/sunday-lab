import { motion } from 'framer-motion'
import { useGame } from '../engine/store'
import { sfx, initAudioOnFirstGesture } from '../engine/sound'
import { useEffect } from 'react'

export default function TitleScreen() {
  const newRun = useGame((s) => s.newRun)
  const continueRun = useGame((s) => s.continueRun)
  const hasSave = useGame((s) => s.hasSave)

  useEffect(() => {
    initAudioOnFirstGesture()
  }, [])

  return (
    <div className="scanline relative flex min-h-full w-full items-center justify-center overflow-hidden">
      <img src="/art/key-art.png" alt="" className="kenburns absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-abyss/60 via-abyss/70 to-abyss" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 px-6 py-10 text-center">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="font-mono text-[11px] tracking-[0.5em] text-cyan-300">
          A SYSTEM DESIGN GAME
        </motion.p>
        <h1
          data-text="THE ACCIDENTAL CTO"
          className="glitch mt-4 bg-gradient-to-r from-cyan-200 via-slate-100 to-amber-200 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-7xl"
        >
          THE ACCIDENTAL CTO
        </h1>

        <div className="mx-auto mt-5 max-w-xl leading-relaxed text-slate-300">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            One dead server at 3 AM. One WhatsApp PDF idea. One accidental promotion.
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-1">
            Debug live incidents. Scale from a single VPS to a global edge network. Learn how real systems grow, break, and heal.
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[10px] tracking-widest text-slate-400">
          {['TERMINALS', 'INCIDENTS', 'LOAD BALANCERS', 'KAFKA', 'KUBERNETES', 'SHARDING', 'EDGE'].map((t, i) => (
            <span key={t} className="flex items-center gap-2">
              {i > 0 && <span className="text-cyan-glow">→</span>}
              <span>{t}</span>
            </span>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="mt-9 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              sfx.boot()
              newRun()
            }}
            className="group relative overflow-hidden rounded-lg border border-cyan-glow/60 bg-cyan-glow/15 px-14 py-4 font-mono text-base font-bold tracking-widest text-cyan-100 transition-all hover:bg-cyan-glow/25 hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] focus:outline-none"
          >
            <span className="relative z-10">START YOUR RUN →</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </button>
          {hasSave && (
            <button
              onClick={() => {
                sfx.click()
                continueRun()
              }}
              className="rounded-lg border border-edge px-8 py-2 font-mono text-xs tracking-widest text-slate-400 transition-all hover:border-cyan-glow/40 hover:text-cyan-200 focus:outline-none"
            >
              CONTINUE SAVED RUN
            </button>
          )}
          <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                sfx.click()
                document.dispatchEvent(new CustomEvent('open-lab'))
              }}
              className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-8 py-2 font-mono text-xs tracking-widest text-amber-200 transition-all hover:bg-amber-400/20 focus:outline-none"
            >
              SANDBOX LAB (ALPHA) →
            </button>
            <button
              onClick={() => {
                sfx.click()
                document.dispatchEvent(new CustomEvent('open-arena'))
              }}
              className="rounded-lg border border-rose-400/50 bg-rose-400/10 px-8 py-2 font-mono text-xs tracking-widest text-rose-200 transition-all hover:bg-rose-400/20 focus:outline-none"
            >
              INTERVIEW ARENA →
            </button>
            <button
              onClick={() => {
                sfx.click()
                document.dispatchEvent(new CustomEvent('open-incident'))
              }}
              className="rounded-lg border border-red-alert/50 bg-red-alert/10 px-8 py-2 font-mono text-xs tracking-widest text-rose-200 transition-all hover:bg-red-alert/20 focus:outline-none"
            >
              INCIDENT COMMANDER →
            </button>
            <button
              onClick={() => {
                sfx.click()
                document.dispatchEvent(new CustomEvent('open-mastery'))
              }}
              className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-8 py-2 font-mono text-xs tracking-widest text-emerald-200 transition-all hover:bg-emerald-400/20 focus:outline-none"
            >
              MASTERY TRACKER →
            </button>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-7 font-mono text-[10px] tracking-wider text-slate-600">
          Based on the book “The Accidental CTO” · 27 chapters · incident consoles · codex inside
        </motion.p>
      </motion.div>
    </div>
  )
}
