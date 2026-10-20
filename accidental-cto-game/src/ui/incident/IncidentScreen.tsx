import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { INCIDENTS, type IncidentAction, type IncidentDef, type IncidentEvent } from '../../content/incidents'
import { finalScore, incidentGrade, type HandledEvent } from '../../engine/incident'
import { buildTopology, SimEngine } from '../../sim/engine'
import { useProfile } from '../../engine/profile'
import { WrButton, WrChip, WrLabel } from '../system'
import LiveChart from '../LiveChart'
import { sfx } from '../../engine/sound'

type Phase = 'select' | 'live' | 'retro' | 'debrief'

export default function IncidentScreen({ onExit }: { onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>('select')
  const [def, setDef] = useState<IncidentDef | null>(null)
  const [t, setT] = useState(0)
  const [score, setScore] = useState(0)
  const [queue, setQueue] = useState<{ event: IncidentEvent; eventId: number; appearedAt: number }[]>([])
  const [handled, setHandled] = useState<HandledEvent[]>([])
  const [flash, setFlash] = useState<{ text: string; good: boolean } | null>(null)
  const incidentsCleared = useProfile((st) => st.incidentsCleared)
  const [retroAnswer, setRetroAnswer] = useState<number | null>(null)
  const [endError, setEndError] = useState(0)
  const engRef = useRef<SimEngine | null>(null)
  const firedRef = useRef<Set<number>>(new Set())
  const handledRef = useRef<HandledEvent[]>([])

  const start = (def: IncidentDef) => {
    sfx.alarm()
    const topo = buildTopology({ cdn: true, ratelimit: true, lb: true, appCount: 4, appCapacity: 4000, cache: true, cacheHitRate: 0.8, replicas: 2, queueWorker: true, search: false, dbCapacity: 8000, trafficRps: def.trafficRps })
    engRef.current = new SimEngine(topo, 99)
    firedRef.current = new Set()
    handledRef.current = []
    setDef(def)
    setT(0)
    setScore(0)
    setQueue([])
    setHandled([])
    setFlash(null)
    setRetroAnswer(null)
    setPhase('live')
  }

  useEffect(() => {
    if (phase !== 'live' || !def) return
    const iv = setInterval(() => {
      const eng = engRef.current
      if (!eng) return
      const snap = eng.step()
      const seconds = snap.t / 1000
      setT(seconds)
      setEndError(snap.errorRate)

      def.events.forEach((ev, i) => {
        if (seconds >= ev.atS && !firedRef.current.has(i)) {
          firedRef.current.add(i)
          setQueue((q) => [...q, { event: ev, eventId: i, appearedAt: seconds }])
          sfx.pag()
        }
      })

      setQueue((q) => {
        const expired = q.filter((item) => seconds - item.appearedAt > 25)
        if (expired.length > 0) {
          for (const item of expired) {
            handledRef.current = [...handledRef.current, { eventId: item.eventId, actionId: 'timeout', kind: 'wasteful' }]
            setHandled([...handledRef.current])
            setScore((s) => s - 30)
          }
          sfx.fail()
          return q.filter((item) => seconds - item.appearedAt <= 25)
        }
        return q
      })

      if (seconds >= def.durationS) {
        setPhase('retro')
        clearInterval(iv)
      }
    }, 100)
    return () => clearInterval(iv)
  }, [phase, def])

  const act = (item: { event: IncidentEvent; eventId: number }, action: IncidentAction) => {
    sfx.click()
    handledRef.current = [...handledRef.current, { eventId: item.eventId, actionId: action.id, kind: action.kind }]
    setHandled([...handledRef.current])
    setScore((s) => s + (action.kind === 'correct' ? 100 : action.kind === 'wasteful' ? 25 : -60))
    setQueue((q) => q.filter((x) => x.eventId !== item.eventId))
    setFlash({ text: action.feedback, good: action.kind === 'correct' })
    if (action.kind === 'correct') sfx.success()
    else if (action.kind === 'harmful') {
      sfx.fail()
      engRef.current?.spike(2.5, 4)
    } else sfx.wrong()
    setTimeout(() => setFlash(null), 4200)
  }

  if (phase === 'select') {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-edge bg-panel/95 px-4 py-2.5">
          <button onClick={onExit} className="rounded border border-edge px-2.5 py-1 font-mono text-[10px] tracking-widest text-slate-400 hover:border-cyan-glow/50 hover:text-cyan-200">
            ← EXIT
          </button>
          <span className="font-mono text-sm font-bold tracking-widest text-rose-300">INCIDENT COMMANDER</span>
          <span className="font-mono text-[9px] tracking-[0.3em] text-slate-500">REAL-TIME TRIAGE · 90 SECONDS EACH</span>
        </header>
        <div className="mx-auto grid w-full max-w-4xl gap-4 p-6 md:grid-cols-3">
          {INCIDENTS.map((inc) => {
            const cleared = incidentsCleared.includes(inc.id)
            return (
              <motion.button
                key={inc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => start(inc)}
                className={`rounded-xl border p-5 text-left transition-all hover:shadow-[0_0_24px_rgba(251,77,99,0.15)] ${cleared ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-alert/40 bg-panel/90 hover:border-red-alert'}`}
              >
                <div className="flex items-center justify-between font-mono text-[9px] tracking-widest">
                  <span className="text-red-alert alert-pulse">● {cleared ? 'CLEARED' : 'ARMED'}</span>
                  <span className="text-slate-500">{inc.events.length} ALERTS · {inc.durationS}s</span>
                </div>
                <h3 className="mt-2 font-bold text-slate-100">{inc.name}</h3>
                <p className="mt-1.5 text-[12px] leading-snug text-slate-400">{inc.brief}</p>
              </motion.button>
            )
          })}
        </div>
        <p className="mx-auto max-w-2xl px-6 text-center font-mono text-[10px] leading-relaxed tracking-wide text-slate-500">
          ALERTS ARRIVE LIVE. EACH HAS 25 SECONDS BEFORE IT AUTO-ESCALATES (-30). CORRECT TRIAGE +100 · WASTEFUL +25 · HARMFUL -60 AND A TRAFFIC SPIKE. POSTMORTEM +60.
        </p>
      </div>
    )
  }

  if (phase === 'live' && def) {
    return (
      <div className={`relative flex h-full flex-col ${flash ? (flash.good ? '' : 'alert-mode') : ''}`}>
        <header className="flex flex-wrap items-center gap-3 border-b border-edge bg-panel/95 px-4 py-2.5">
          <span className="font-mono text-sm font-bold tracking-widest text-rose-300 alert-pulse">{def.name}</span>
          <div className="ml-auto flex items-center gap-2">
            <WrChip label="T" value={`${t.toFixed(0)}s / ${def.durationS}s`} tone="#fbbf24" />
            <WrChip label="SCORE" value={`${score}`} tone={score >= 0 ? '#34d399' : '#fb4d63'} />
          </div>
        </header>
        <div className="relative min-h-0 flex-1">
          <div className="absolute inset-0 p-2 opacity-90">
            {engRef.current && <SimBackdrop eng={engRef.current} />}
          </div>
          <LiveChart alert={queue.length > 0} />

          <div className="absolute right-3 top-3 z-20 flex w-[min(430px,80%)] flex-col gap-2.5">
            <AnimatePresence>
              {queue.map(({ event, eventId }) => (
                <motion.div key={eventId} initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={`rounded-lg border bg-panel/95 p-3 backdrop-blur-sm ${event.severity === 'P1' ? 'border-red-alert/70 glow-red' : 'border-amber-400/50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-[10px] font-bold tracking-widest ${event.severity === 'P1' ? 'text-rose-300 alert-pulse' : 'text-amber-300'}`}>
                      {event.severity} · {event.title}
                    </span>
                    <span className="font-mono text-[9px] text-slate-500">25s TO ACT</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-snug text-slate-300">{event.text}</p>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {event.actions.map((a) => (
                      <button key={a.id} onClick={() => act({ event, eventId }, a)} className="rounded border border-edge bg-panel-2/70 px-3 py-1.5 text-left text-[12px] text-slate-200 transition-all hover:border-cyan-glow/60 hover:bg-panel-2">
                        {a.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {flash && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`absolute bottom-24 left-1/2 z-30 w-[min(520px,90%)] -translate-x-1/2 rounded-lg border p-3 backdrop-blur-sm ${flash.good ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-rose-500/60 bg-rose-500/10'}`}>
                <p className="text-[12px] leading-snug text-slate-200">{flash.text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-3 right-3 font-mono text-[10px] tracking-widest text-slate-500">
            HANDLED {handled.length}/{def.events.length}
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'retro' && def) {
    const answered = retroAnswer !== null
    return (
      <div className="flex h-full items-center justify-center overflow-y-auto p-6">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-[min(620px,94vw)] rounded-xl panel glow-cyan p-6">
          <WrLabel>BLAMELESS POSTMORTEM — {def.name}</WrLabel>
          <p className="mt-2 text-lg font-bold text-slate-100">{def.retro.q}</p>
          <div className="mt-4 flex flex-col gap-2">
            {def.retro.options.map((opt, i) => {
              const isAnswer = i === def.retro.answer
              const chosen = retroAnswer === i
              return (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => {
                    if (i === def.retro.answer) sfx.correct()
                    else sfx.wrong()
                    setRetroAnswer(i)
                  }}
                  className={`rounded-lg border px-4 py-2.5 text-left text-sm transition-all ${
                    answered
                      ? isAnswer
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
                        : chosen
                          ? 'border-rose-500/60 bg-rose-500/10 text-rose-200'
                          : 'border-edge text-slate-500'
                      : 'border-edge bg-panel-2/60 text-slate-200 hover:border-cyan-glow/50'
                  }`}
                >
                  <span className="mr-2 font-mono text-[10px] text-slate-500">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              )
            })}
          </div>
          {answered && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
              <p className="rounded-md border-l-2 border-amber-400/70 bg-amber-400/5 px-3 py-2 text-[12px] leading-relaxed text-slate-300">{def.retro.explain}</p>
              <div className="mt-4">
                <WrButton variant="primary" onClick={() => { sfx.click(); setPhase('debrief') }}>
                  DEBRIEF →
                </WrButton>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    )
  }

  if (phase === 'debrief' && def) {
    const retroCorrect = retroAnswer === def.retro.answer
    const { total, breakdown } = finalScore(handled, def.events, retroCorrect, endError)
    const g = incidentGrade(total)
    if (total >= 220) {
      const concepts = def.concepts
      useProfile.getState().recordIncident(def.id, concepts)
    }
    return (
      <div className="flex h-full items-center justify-center overflow-y-auto p-6">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="w-[min(600px,94vw)] rounded-xl panel p-6 text-center" style={{ boxShadow: `0 0 40px ${g.tone}22` }}>
          <span className="font-mono text-[10px] tracking-[0.4em] text-slate-500">INCIDENT CLOSED · T+{def.durationS}s</span>
          <h2 className="mt-2 text-4xl font-extrabold tracking-tight" style={{ color: g.tone }}>
            {g.label}
          </h2>
          <div className="mt-1 font-mono text-2xl font-bold text-slate-100">{total} pts</div>
          <div className="mt-5 space-y-1.5 text-left">
            {breakdown.map((b) => (
              <div key={b.label} className="flex justify-between rounded-md border border-edge bg-panel-2/50 px-3 py-1.5 font-mono text-[11px]">
                <span className="text-slate-500">{b.label}</span>
                <span className="font-bold text-slate-200">{b.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-center gap-3">
            <WrButton variant="primary" onClick={() => start(def)}>
              RUN IT AGAIN
            </WrButton>
            <WrButton onClick={() => setPhase('select')}>ALL INCIDENTS</WrButton>
            <WrButton onClick={onExit}>EXIT</WrButton>
          </div>
        </motion.div>
      </div>
    )
  }

  return null
}

function SimBackdrop({ eng }: { eng: SimEngine }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 250)
    return () => clearInterval(iv)
  }, [])
  const snap = eng.history[eng.history.length - 1]
  if (!snap) return null
  return (
    <div className="absolute left-3 top-3 flex gap-2">
      <WrChip label="RPS" value={Math.round(snap.trafficRps).toLocaleString()} />
      <WrChip label="P95" value={`${Math.round(snap.p95)}ms`} tone={snap.p95 > 500 ? '#fb4d63' : '#34d399'} />
      <WrChip label="ERRORS" value={`${(snap.errorRate * 100).toFixed(1)}%`} tone={snap.errorRate > 0.1 ? '#fb4d63' : '#34d399'} />
    </div>
  )
}
