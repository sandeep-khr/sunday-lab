import { motion } from 'framer-motion'
import { useGame } from '../engine/store'

export default function GameOverScreen() {
  const gameOver = useGame((s) => s.gameOver)
  const game = useGame((s) => s.game)
  const newRun = useGame((s) => s.newRun)
  if (!gameOver) return null

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-red-alert/10 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="w-[min(560px,92vw)] rounded-xl panel glow-red p-8 text-center">
        <span className="font-mono text-[11px] tracking-[0.4em] text-rose-400">RUN TERMINATED · MONTH {game.month}</span>
        <h2 className="mt-3 text-5xl font-extrabold tracking-tight text-rose-400 alert-pulse">{gameOver.title}</h2>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-slate-300">{gameOver.text}</p>
        <p className="mt-4 font-mono text-xs tracking-wider text-slate-500">
          FINAL STACK: {game.unlocked.length} COMPONENTS · {Math.round(game.users)}K MERCHANTS · ${Math.round(game.cash)}K IN THE BANK
        </p>
        <button
          onClick={newRun}
          className="mt-8 rounded-lg border border-rose-400/50 bg-rose-500/10 px-8 py-3 font-mono text-sm font-bold tracking-widest text-rose-200 transition-all hover:bg-rose-500/20 focus:outline-none"
        >
          REBUILD FROM SCRATCH
        </button>
      </motion.div>
    </div>
  )
}
