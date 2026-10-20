import { motion } from 'framer-motion'
import { useGame } from '../engine/store'

export default function LevelIntro() {
  const chapter = useGame((s) => s.chapter())
  const begin = useGame((s) => s.beginChapter)

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      {chapter.art && (
        <div className="relative h-44 w-full overflow-hidden border-b border-edge md:h-56">
          <motion.img
            initial={{ scale: 1.12, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            src={chapter.art}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
        </div>
      )}
      <div className="px-6 py-6">
        <motion.span
          initial={{ opacity: 0, letterSpacing: '0.8em' }}
          animate={{ opacity: 1, letterSpacing: '0.35em' }}
          transition={{ duration: 0.9 }}
          className="font-mono text-[11px] text-cyan-300"
        >
          ACT {chapter.act}
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="mt-2 text-3xl font-extrabold tracking-tight text-slate-50"
        >
          Chapter {chapter.num} — {chapter.title}
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-1 font-mono text-xs tracking-wider text-amber-400/90">
          {chapter.tagline}
        </motion.p>

        <div className="mt-5 space-y-3 border-l-2 border-edge pl-4">
          {chapter.story.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.3 }}
              className="leading-relaxed text-slate-300"
            >
              {line}
            </motion.p>
          ))}
        </div>

        <button
          onClick={begin}
          className="mt-7 w-full rounded-lg border border-cyan-glow/50 bg-cyan-glow/10 py-3 font-mono text-sm font-bold tracking-widest text-cyan-200 transition-all hover:bg-cyan-glow/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] focus:outline-none"
        >
          BEGIN CHAPTER {chapter.num} →
        </button>
      </div>
    </div>
  )
}
