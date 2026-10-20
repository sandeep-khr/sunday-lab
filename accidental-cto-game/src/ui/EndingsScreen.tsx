import { motion } from 'framer-motion'
import { useGame } from '../engine/store'

const ENDINGS = {
  ipo: {
    title: 'THE ACCIDENTAL CTO, INTENTIONAL LEGEND',
    tone: '#34d399',
    art: '/art/characters.png',
    text: 'The bell rings at the exchange and your platform processes 40,000 orders a second without blinking. You came in to fix one dead server. You leave having built infrastructure that never sleeps — and a team that no longer needs you in the room.',
  },
  acquired: {
    title: 'ACQUIRED — THE PLATFORM ENDURES',
    tone: '#22d3ee',
    art: '/art/characters.png',
    text: 'A giant writes the check and keeps your architecture running as their merchant layer. Not the fireworks ending, but your design decisions will outlive every reorg. The book closes with steady graphs and quiet pride.',
  },
  survived: {
    title: 'SURVIVED — SCARS AS DOCUMENTATION',
    tone: '#fbbf24',
    art: '/art/characters.png',
    text: 'You kept the lights on through growth pains, shark tanks and live failovers. The stack creaks in places, some lessons arrived as outages — but every incident became institutional knowledge. The accidental CTO is accidental no more.',
  },
} as const

export default function EndingsScreen() {
  const ending = useGame((s) => s.ending)
  const game = useGame((s) => s.game)
  const newRun = useGame((s) => s.newRun)
  if (!ending) return null
  const e = ENDINGS[ending.kind]

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-abyss/92 p-6">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-[min(720px,94vw)] rounded-xl panel glow-cyan p-8 text-center">
        <span className="font-mono text-[11px] tracking-[0.4em]" style={{ color: e.tone }}>
          RUN COMPLETE · MONTH {game.month} · SCORE {ending.score}
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: e.tone }}>
          {e.title}
        </h2>
        {e.art && <img src={e.art} alt="" className="mx-auto mt-5 max-h-44 rounded-lg border border-edge object-cover" />}
        <p className="mx-auto mt-5 max-w-xl leading-relaxed text-slate-300">{e.text}</p>

        <div className="mt-7 grid grid-cols-2 gap-3 text-left font-mono text-xs sm:grid-cols-4">
          <Stat k="MERCHANTS" v={`${Math.round(game.users)}K`} />
          <Stat k="STACK" v={`${game.unlocked.length}/17`} />
          <Stat k="RELIABILITY" v={`${Math.round(game.reliability)}%`} />
          <Stat k="P95" v={`${Math.round(Math.max(45, Math.min(999, 880 - game.speed * 7.5)))}ms`} />
        </div>

        <button
          onClick={newRun}
          className="mt-8 rounded-lg border border-cyan-glow/60 bg-cyan-glow/10 px-10 py-3 font-mono text-sm font-bold tracking-widest text-cyan-200 transition-all hover:bg-cyan-glow/20 focus:outline-none"
        >
          NEW RUN →
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
