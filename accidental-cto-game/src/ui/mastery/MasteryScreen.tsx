import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CODEX } from '../../engine/codex'
import { useProfile } from '../../engine/profile'
import { domainMastery, nodeState, overallMastery, SKILL_DOMAINS } from '../../content/skilltree'
import { WrButton, WrLabel, WrPanel } from '../system'
import { sfx } from '../../engine/sound'

export default function MasteryScreen({ onExit }: { onExit: () => void }) {
  const profile = useProfile()
  const [reviewing, setReviewing] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [cardIdx, setCardIdx] = useState(0)

  const allConcepts = useMemo(() => SKILL_DOMAINS.flatMap((d) => d.concepts).filter((c) => CODEX[c]), [])
  const due = useMemo(() => profile.dueCards(allConcepts), [profile, allConcepts])
  const overall = overallMastery(profile.mastery)
  const masteredCount = allConcepts.filter((c) => nodeState(profile.mastery[c]) === 'mastered').length

  const card = due.length > 0 ? CODEX[due[cardIdx % due.length]] : null

  const gradeCard = (grade: 'again' | 'hard' | 'good' | 'easy') => {
    if (!card) return
    sfx.click()
    profile.reviewCard(card.id, grade)
    setRevealed(false)
    setCardIdx((i) => i + 1)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-edge bg-panel/95 px-4 py-2.5 backdrop-blur-sm">
        <button onClick={onExit} className="rounded border border-edge px-2.5 py-1 font-mono text-[10px] tracking-widest text-slate-400 hover:border-cyan-glow/50 hover:text-cyan-200">
          ← EXIT
        </button>
        <span className="font-mono text-sm font-bold tracking-widest text-cyan-300">MASTERY TRACKER</span>
        <span className="font-mono text-[9px] tracking-[0.3em] text-slate-500">SKILL TREE · SPACED REPETITION</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-400">
            {masteredCount}/{allConcepts.length} MASTERED · {due.length} CARDS DUE
          </span>
          <WrButton variant={due.length > 0 ? 'primary' : 'ghost'} onClick={() => { setReviewing(true); setRevealed(false) }} disabled={due.length === 0}>
            REVIEW {due.length} CARDS
          </WrButton>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl p-5">
        <div className="mb-5 flex items-center gap-4 rounded-xl border border-edge bg-panel/80 p-4">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e2d47" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(overall / 100) * 99.8} 99.8`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-cyan-200">{overall}%</span>
          </div>
          <div>
            <WrLabel>OVERALL SYSTEM DESIGN MASTERY</WrLabel>
            <p className="text-[13px] leading-snug text-slate-400">
              Earn mastery by: campaign quizzes (+10), lab challenge wins (+18), arena scores ≥70 (+15), incident clears (+20), flashcard reviews (+2).
              80+ on a concept = mastered.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {SKILL_DOMAINS.map((d) => {
            const pct = domainMastery(profile.mastery, d)
            return (
              <WrPanel key={d.id} title={d.name} right={<span className="font-mono text-[10px] font-bold" style={{ color: pct >= 80 ? '#34d399' : pct > 0 ? '#fbbf24' : '#44546e' }}>{pct}%</span>}>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-edge">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {d.concepts.map((c) => {
                    const st = nodeState(profile.mastery[c])
                    const entry = CODEX[c]
                    return (
                      <span
                        key={c}
                        title={entry?.definition}
                        className={`rounded-sm border px-1.5 py-0.5 font-mono text-[9px] tracking-wide ${
                          st === 'mastered'
                            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                            : st === 'learning'
                              ? 'border-cyan-glow/40 bg-cyan-glow/10 text-cyan-200'
                              : 'border-edge text-slate-600'
                        }`}
                      >
                        {st === 'locked' ? '???' : entry?.term}
                        {st === 'mastered' ? ' ★' : ''}
                      </span>
                    )
                  })}
                </div>
              </WrPanel>
            )
          })}
        </div>

        <div className="mt-5 flex justify-center">
          <WrButton
            variant="danger"
            onClick={() => {
              if (confirm('Reset all mastery progress, SRS cards and records?')) profile.reset()
            }}
          >
            RESET PROGRESS
          </WrButton>
        </div>
      </div>

      <AnimatePresence>
        {reviewing && card && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex items-center justify-center bg-abyss/90 p-6 backdrop-blur-sm">
            <motion.div
              key={card.id + String(revealed)}
              initial={{ opacity: 0, y: 16, rotateX: -6 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              className="w-[min(560px,94vw)] rounded-xl panel glow-cyan p-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] tracking-[0.3em] text-cyan-300">{card.tag.toUpperCase()} · SRS</span>
                <button onClick={() => { setReviewing(false); setRevealed(false) }} className="rounded border border-edge px-2 py-0.5 font-mono text-[10px] text-slate-500 hover:text-cyan-200">
                  END
                </button>
              </div>
              <h3 className="mt-3 text-2xl font-extrabold text-slate-50">{card.term}</h3>
              <AnimatePresence mode="wait">
                {revealed ? (
                  <motion.div key="back" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">{card.definition}</p>
                    {card.analogy && <p className="mt-2 border-l-2 border-amber-400/60 pl-3 text-[12px] italic leading-relaxed text-amber-100/80">{card.analogy}</p>}
                    <ul className="mt-3 space-y-1">
                      {card.points.map((p, i) => (
                        <li key={i} className="flex gap-2 text-[12px] text-slate-400">
                          <span className="text-cyan-glow">▸</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 grid grid-cols-4 gap-2">
                      <button onClick={() => gradeCard('again')} className="rounded-lg border border-rose-500/50 bg-rose-500/10 py-2 font-mono text-[11px] font-bold text-rose-200 hover:bg-rose-500/20">
                        AGAIN
                      </button>
                      <button onClick={() => gradeCard('hard')} className="rounded-lg border border-amber-400/50 bg-amber-400/10 py-2 font-mono text-[11px] font-bold text-amber-200 hover:bg-amber-400/20">
                        HARD
                      </button>
                      <button onClick={() => gradeCard('good')} className="rounded-lg border border-cyan-glow/50 bg-cyan-glow/10 py-2 font-mono text-[11px] font-bold text-cyan-200 hover:bg-cyan-glow/20">
                        GOOD
                      </button>
                      <button onClick={() => gradeCard('easy')} className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 py-2 font-mono text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/20">
                        EASY
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="front">
                    <p className="mt-2 font-mono text-[11px] text-slate-500">Recall the definition, the analogy, and one key point — then reveal.</p>
                    <div className="mt-5">
                      <WrButton variant="primary" onClick={() => { sfx.click(); setRevealed(true) }}>
                        REVEAL ANSWER
                      </WrButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="mt-4 font-mono text-[9px] tracking-widest text-slate-600">{due.length} CARDS IN QUEUE</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
