import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ARENA_PROMPTS } from '../../content/arena-prompts'
import { COMPONENTS, grade, MAX, scoreClarify, scoreDesign, scoreMcqList, totalScore } from '../../engine/arena'
import { WrButton, WrChip, WrLabel, WrPanel } from '../system'
import { sfx } from '../../engine/sound'
import { useProfile } from '../../engine/profile'

type Phase = 'select' | 'clarify' | 'estimate' | 'design' | 'defend' | 'score'

interface Results {
  clarify: ReturnType<typeof scoreClarify>
  estimate: ReturnType<typeof scoreMcqList>
  design: ReturnType<typeof scoreDesign>
  defend: ReturnType<typeof scoreMcqList>
}

export default function ArenaScreen({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>('select')
  const [promptId, setPromptId] = useState<string | null>(null)
  const prompt = ARENA_PROMPTS.find((p) => p.id === promptId) ?? null

  const [clarifyPicks, setClarifyPicks] = useState<string[]>([])
  const [clarifyDone, setClarifyDone] = useState(false)
  const [estIdx, setEstIdx] = useState(0)
  const [estAnswers, setEstAnswers] = useState<(number | null)[]>([])
  const [estFeedback, setEstFeedback] = useState(false)
  const [designPicks, setDesignPicks] = useState<string[]>([])
  const [designDone, setDesignDone] = useState(false)
  const [defIdx, setDefIdx] = useState(0)
  const [defAnswers, setDefAnswers] = useState<(number | null)[]>([])
  const [defFeedback, setDefFeedback] = useState(false)


  const start = (id: string) => {
    sfx.click()
    totalRecorded.current = false
    setPromptId(id)
    setPhase('clarify')
    setClarifyPicks([])
    setClarifyDone(false)
    setEstIdx(0)
    setEstAnswers([])
    setEstFeedback(false)
    setDesignPicks([])
    setDesignDone(false)
    setDefIdx(0)
    setDefAnswers([])
    setDefFeedback(false)
  }

  const results: Results | null = useMemo(() => {
    if (!prompt || phase !== 'score') return null
    return {
      clarify: scoreClarify(prompt, clarifyPicks),
      estimate: scoreMcqList(prompt.estimate, estAnswers),
      design: scoreDesign(prompt, designPicks),
      defend: scoreMcqList(prompt.defend, defAnswers),
    }
  }, [phase, prompt, clarifyPicks, estAnswers, designPicks, defAnswers])

  const totalRecorded = useRef(false)

  const total = results ? totalScore({ clarify: results.clarify.points, estimate: results.estimate.correct / results.estimate.total, design: results.design.points, defend: results.defend.correct / results.defend.total }) : 0
  const g = grade(total)

  if (phase === 'score' && results && prompt && !totalRecorded.current) {
    totalRecorded.current = true
    const concepts = prompt.id === 'tinyurl' ? ['caching', 'nosql', 'ratelimit'] : prompt.id === 'twitter' ? ['sharding', 'kafka', 'caching'] : prompt.id === 'whatsapp' ? ['realtime', 'sharding', 'nosql'] : ['ratelimit', 'caching', 'estimation']
    useProfile.getState().recordArena(prompt.id, total, concepts)
  }
  if (phase === 'select') {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <header className="flex items-center gap-3 border-b border-edge bg-panel/90 px-4 py-2.5">
          <button onClick={onExit} className="rounded border border-edge px-2.5 py-1 font-mono text-[10px] tracking-widest text-slate-400 hover:border-cyan-glow/50 hover:text-cyan-200">
            ← EXIT ARENA
          </button>
          <span className="font-mono text-sm font-bold tracking-widest text-cyan-300">INTERVIEW ARENA</span>
          <span className="font-mono text-[9px] tracking-[0.3em] text-slate-500">RUBRIC-SCORED MOCK INTERVIEWS · ALPHA</span>
        </header>
        <div className="mx-auto grid w-full max-w-4xl gap-4 p-6 md:grid-cols-2">
          {ARENA_PROMPTS.map((p) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => start(p.id)}
              className="rounded-xl border border-edge bg-panel/90 p-5 text-left transition-all hover:border-cyan-glow/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] tracking-[0.3em] text-amber-400">{p.difficulty}</span>
                <span className="font-mono text-[9px] text-slate-500">4 PHASES · RUBRIC /100</span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-slate-100">{p.title}</h3>
              <p className="mt-1 text-[12px] leading-snug text-slate-400">{p.ask}</p>
              <p className="mt-3 font-mono text-[10px] tracking-wide text-cyan-300/80">INTERVIEWER: {p.persona}</p>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  if (!prompt) return null

  const phaseHeader = (
    <header className="flex items-center justify-between border-b border-edge bg-panel/90 px-4 py-2.5">
      <button onClick={onExit} className="rounded border border-edge px-2.5 py-1 font-mono text-[10px] tracking-widest text-slate-400 hover:border-cyan-glow/50 hover:text-cyan-200">
        ← EXIT
      </button>
      <div className="flex items-center gap-2">
        {(['clarify', 'estimate', 'design', 'defend'] as const).map((p, i) => {
          const active = phase === p
          const done =
            (p === 'clarify' && clarifyDone) ||
            (p === 'estimate' && estIdx >= prompt.estimate.length) ||
            (p === 'design' && designDone) ||
            (p === 'defend' && defIdx >= prompt.defend.length)
          return (
            <span
              key={p}
              className={`rounded px-2 py-0.5 font-mono text-[9px] tracking-widest ${active ? 'bg-cyan-glow/15 text-cyan-200' : done ? 'text-emerald-400' : 'text-slate-600'}`}
            >
              {i + 1}·{p.toUpperCase()}
            </span>
          )
        })}
      </div>
      <span className="font-mono text-[10px] tracking-widest text-slate-500">{prompt.title}</span>
    </header>
  )

  if (phase === 'clarify') {
    const canSubmit = clarifyPicks.length === prompt.clarify.picks
    return (
      <div className="flex h-full flex-col">
        {phaseHeader}
        <div className="mx-auto w-full max-w-3xl overflow-y-auto p-6">
          <div className="mb-4 rounded-lg border border-edge bg-panel/80 p-4">
            <WrLabel>THE INTERVIEWER — {prompt.persona}</WrLabel>
            <p className="text-sm leading-relaxed text-slate-200">“{prompt.ask}”</p>
          </div>
          <p className="mb-3 text-[15px] font-semibold text-slate-100">{prompt.clarify.prompt}</p>
          <div className="grid gap-2 md:grid-cols-2">
            {prompt.clarify.options.map((o) => {
              const picked = clarifyPicks.includes(o.id)
              const showFb = clarifyDone
              return (
                <button
                  key={o.id}
                  disabled={clarifyDone || (!picked && clarifyPicks.length >= prompt.clarify.picks)}
                  onClick={() => {
                    sfx.click()
                    setClarifyPicks((p) => (picked ? p.filter((x) => x !== o.id) : [...p, o.id]))
                  }}
                  className={`rounded-lg border p-3 text-left text-sm transition-all ${
                    showFb
                      ? o.good && picked
                        ? 'border-emerald-500/60 bg-emerald-500/10'
                        : picked
                          ? 'border-rose-500/60 bg-rose-500/10'
                          : o.good
                            ? 'border-amber-400/40 bg-amber-400/5'
                            : 'border-edge opacity-50'
                      : picked
                        ? 'border-cyan-glow/70 bg-cyan-glow/10'
                        : 'border-edge bg-panel-2/60 hover:border-cyan-glow/40'
                  }`}
                >
                  {o.text}
                  {showFb && picked && <p className="mt-1.5 text-[11px] leading-snug text-slate-400">{o.feedback}</p>}
                  {showFb && !picked && o.good && <p className="mt-1.5 text-[11px] leading-snug text-amber-300/70">You missed this one: {o.feedback}</p>}
                </button>
              )
            })}
          </div>
          <div className="mt-5 flex items-center gap-3">
            {!clarifyDone ? (
              <WrButton variant="primary" disabled={!canSubmit} onClick={() => { sfx.click(); setClarifyDone(true) }}>
                ASK THESE QUESTIONS ({clarifyPicks.length}/{prompt.clarify.picks})
              </WrButton>
            ) : (
              <WrButton variant="primary" onClick={() => { sfx.click(); setPhase('estimate') }}>
                PROCEED TO ESTIMATIONS →
              </WrButton>
            )}
            {clarifyDone && <span className="font-mono text-[10px] text-slate-500">CLARITY SCORED: {results === null ? scoreClarify(prompt, clarifyPicks).points : results.clarify.points}/30 — GOOD QUESTIONS ARE FREE POINTS.</span>}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'estimate' || phase === 'defend') {
    const list = phase === 'estimate' ? prompt.estimate : prompt.defend
    const idx = phase === 'estimate' ? estIdx : defIdx
    const answers = phase === 'estimate' ? estAnswers : defAnswers
    const setAnswers = phase === 'estimate' ? setEstAnswers : setDefAnswers
    const feedback = phase === 'estimate' ? estFeedback : defFeedback
    const setFeedback = phase === 'estimate' ? setEstFeedback : setDefFeedback
    const mcq = list[Math.min(idx, list.length - 1)]
    const answered = answers[idx] !== null && answers[idx] !== undefined

    const next = () => {
      sfx.click()
      if (idx + 1 >= list.length) {
        if (phase === 'estimate') setPhase('design')
        else setPhase('score')
        return
      }
      if (phase === 'estimate') setEstIdx(idx + 1)
      else setDefIdx(idx + 1)
      setFeedback(false)
    }

    return (
      <div className="flex h-full flex-col">
        {phaseHeader}
        <div className="mx-auto w-full max-w-2xl p-6">
          <div className="mb-3 flex justify-center gap-1.5">
            {list.map((_, i) => (
              <span key={i} className={`h-1.5 w-8 rounded-full ${i < idx ? 'bg-emerald-400' : i === idx ? 'bg-cyan-glow' : 'bg-edge'}`} />
            ))}
          </div>
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-edge bg-panel/90 p-5">
            <p className="text-[15px] font-semibold text-slate-100">{mcq.q}</p>
            <div className="mt-4 flex flex-col gap-2">
              {mcq.options.map((opt, oi) => {
                const isAnswer = oi === mcq.answer
                const chosen = answers[idx] === oi
                return (
                  <button
                    key={oi}
                    disabled={feedback}
                    onClick={() => {
                      if (oi === mcq.answer) sfx.correct()
                      else sfx.wrong()
                      setAnswers((a) => {
                        const copy = [...a]
                        copy[idx] = oi
                        return copy
                      })
                      setFeedback(true)
                    }}
                    className={`rounded-lg border px-4 py-2.5 text-left text-sm transition-all ${
                      feedback
                        ? isAnswer
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
                          : chosen
                            ? 'border-rose-500/60 bg-rose-500/10 text-rose-200'
                            : 'border-edge text-slate-500'
                        : 'border-edge bg-panel-2/60 text-slate-200 hover:border-cyan-glow/50'
                    }`}
                  >
                    <span className="mr-2 font-mono text-[10px] text-slate-500">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </button>
                )
              })}
            </div>
            {feedback && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <p className="rounded-md border-l-2 border-amber-400/70 bg-amber-400/5 px-3 py-2 text-[12px] leading-relaxed text-slate-300">{mcq.explain}</p>
                <div className="mt-4">
                  <WrButton variant="primary" onClick={next}>
                    {idx + 1 >= list.length ? (phase === 'estimate' ? 'TO THE WHITEBOARD →' : 'SEE MY VERDICT →') : 'NEXT QUESTION →'}
                  </WrButton>
                </div>
              </motion.div>
            )}
          </motion.div>
          <p className="mt-3 text-center font-mono text-[10px] tracking-widest text-slate-600">
            {phase === 'estimate' ? 'BACK-OF-ENVELOPE — STATE ASSUMPTIONS, ROUND AGGRESSIVELY' : 'PUSHBACK — DEFEND YOUR TRADE-OFFS'}
          </p>
          {answered && !feedback && <span />}
        </div>
      </div>
    )
  }

  if (phase === 'design') {
    const canSubmit = designPicks.length > 0
    return (
      <div className="flex h-full flex-col">
        {phaseHeader}
        <div className="mx-auto w-full max-w-3xl overflow-y-auto p-6">
          <div className="mb-4 rounded-lg border border-cyan-glow/30 bg-cyan-glow/5 p-4">
            <WrLabel>WHITEBOARD</WrLabel>
            <p className="text-sm text-slate-200">{prompt.design.prompt}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {COMPONENTS.map((c) => {
              const picked = designPicks.includes(c.id)
              const fb = designDone
              const isRequired = prompt.design.required.includes(c.id)
              const isForbidden = prompt.design.forbidden.find((f) => f.id === c.id)
              return (
                <button
                  key={c.id}
                  disabled={designDone}
                  onClick={() => {
                    sfx.click()
                    setDesignPicks((p) => (picked ? p.filter((x) => x !== c.id) : [...p, c.id]))
                  }}
                  className={`rounded-lg border p-3 text-left font-mono text-[11px] font-bold tracking-wide transition-all ${
                    fb
                      ? isForbidden && picked
                        ? 'border-rose-500/60 bg-rose-500/10 text-rose-200'
                        : isRequired && picked
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
                          : picked
                            ? 'border-cyan-glow/50 bg-cyan-glow/5 text-cyan-200'
                            : isRequired
                              ? 'border-amber-400/40 text-amber-300/70'
                              : 'border-edge opacity-40'
                      : picked
                        ? 'border-cyan-glow/70 bg-cyan-glow/10 text-cyan-100'
                        : 'border-edge bg-panel-2/60 text-slate-300 hover:border-cyan-glow/40'
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
          </div>

          {designDone && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-1.5">
              {scoreDesign(prompt, designPicks).notes.map((n, i) => (
                <p key={i} className={`text-[12px] leading-snug ${n.good ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {n.good ? '✓' : '✗'} {n.text}
                </p>
              ))}
              {scoreDesign(prompt, designPicks).notes.length === 0 && (
                <p className="text-[12px] text-emerald-300">✓ Clean design — every required component justified, nothing gratuitous.</p>
              )}
            </motion.div>
          )}

          <div className="mt-5">
            {!designDone ? (
              <WrButton variant="primary" disabled={!canSubmit} onClick={() => { sfx.click(); setDesignDone(true) }}>
                SUBMIT ARCHITECTURE ({designPicks.length} COMPONENTS)
              </WrButton>
            ) : (
              <WrButton variant="primary" onClick={() => { sfx.click(); setPhase('defend') }}>
                FACE THE PUSHBACK →
              </WrButton>
            )}
          </div>
        </div>
      </div>
    )
  }

  const parts = [
    { label: 'CLARIFYING QUESTIONS', got: results!.clarify.points, max: MAX.clarify, notes: results!.clarify.notes.map((n) => n.text) },
    { label: 'ESTIMATION', got: Math.round((results!.estimate.correct / results!.estimate.total) * MAX.estimate), max: MAX.estimate, notes: results!.estimate.notes.filter((n) => !n.correct).map((n) => n.explain) },
    { label: 'DESIGN', got: results!.design.points, max: MAX.design, notes: results!.design.notes.map((n) => n.text) },
    { label: 'TRADE-OFF DEFENSE', got: Math.round((results!.defend.correct / results!.defend.total) * MAX.defend), max: MAX.defend, notes: results!.defend.notes.filter((n) => !n.correct).map((n) => n.explain) },
  ]

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {phaseHeader}
      <div className="mx-auto w-full max-w-2xl p-6">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <span className="font-mono text-[10px] tracking-[0.4em] text-slate-500">INTERVIEW VERDICT</span>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight" style={{ color: g.tone }}>
            {g.label} · {total}/100
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-300">{g.text}</p>
        </motion.div>

        <div className="mt-6 space-y-3">
          {parts.map((p) => (
            <WrPanel key={p.label} title={p.label}>
              <div className="mb-2 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-edge">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: `${(p.got / p.max) * 100}%` }} />
                </div>
                <span className="font-mono text-xs font-bold text-cyan-200">
                  {p.got}/{p.max}
                </span>
              </div>
              {p.notes.length > 0 ? (
                p.notes.map((n, i) => (
                  <p key={i} className="mt-1 text-[11px] leading-snug text-slate-400">
                    • {n}
                  </p>
                ))
              ) : (
                <p className="text-[11px] text-emerald-400/80">• Flawless phase.</p>
              )}
            </WrPanel>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <WrButton variant="primary" onClick={() => start(prompt.id)}>
            RETRY THIS PROMPT
          </WrButton>
          <WrButton onClick={() => setPhase('select')}>PICK ANOTHER</WrButton>
          <WrButton onClick={onExit}>EXIT ARENA</WrButton>
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <WrChip label="PROMPTS CLEARED" value={`${ARENA_PROMPTS.length}`} />
          <WrChip label="TARGET" value="85+ = STRONG HIRE" tone="#34d399" />
        </div>
      </div>
    </div>
  )
}
