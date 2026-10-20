import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../engine/store'
import { sfx } from '../engine/sound'

export default function InvestigationPanel() {
  const chapter = useGame((s) => s.chapter())
  const scene = useGame((s) => s.scene())
  const invLog = useGame((s) => s.invLog)
  const discovered = useGame((s) => s.invDiscovered)
  const tried = useGame((s) => s.invTried)
  const runCheck = useGame((s) => s.runCheck)
  const attemptFix = useGame((s) => s.attemptFix)
  const hoverUnlock = useGame((s) => s.hoverUnlock)

  const [cmd, setCmd] = useState('')
  const [shake, setShake] = useState(0)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [invLog])

  if (!scene?.investigation) return null
  const inv = scene.investigation

  const exec = (raw: string) => {
    const input = raw.trim()
    if (!input) return
    const norm = input.toLowerCase()
    const match = inv.checks.find(
      (c) => (c.cmd && c.cmd.toLowerCase() === norm) || c.label.toLowerCase() === norm || c.label.toLowerCase().includes(norm) || norm.includes((c.cmd ?? c.label).toLowerCase()),
    )
    if (match) {
      sfx.type()
      runCheck(match.id)
    } else {
      sfx.fail()
      setShake((s) => s + 1)
      useGame.setState({
        invLog: [...useGame.getState().invLog, `$ ${input}`, `sh: command not found: ${input.split(' ')[0]} — check the diagnostics below`, ''],
      })
    }
    setCmd('')
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-edge px-5 py-2">
        <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500">
          ACT {chapter.act} · CH {chapter.num} · INCIDENT CONSOLE
        </span>
        <span className="flex items-center gap-2 font-mono text-[9px] tracking-widest text-red-alert alert-pulse">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-alert" /> LIVE INCIDENT
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="mb-3 space-y-1.5">
          {inv.briefing.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} className="rounded-md border-l-2 border-red-alert/50 bg-panel-2/60 px-2.5 py-1.5 font-mono text-[11px] leading-snug text-slate-300">
              {b}
            </motion.div>
          ))}
        </div>

        <div
          key={shake}
          className={`mb-3 h-44 overflow-y-auto rounded-md border border-edge bg-black/60 p-2.5 font-mono text-[11px] leading-relaxed ${shake ? 'shake-once' : ''}`}
          onClick={() => inputRef.current?.focus()}
          ref={logRef}
        >
          <div className="text-emerald-400/70">cto@prod-bastion:~$ type a command, or click a diagnostic below_</div>
          {invLog.map((line, i) => (
            <div
              key={i}
              className={
                line.startsWith('$')
                  ? 'mt-1 text-cyan-300'
                  : line.startsWith('!!') || line.startsWith('>>')
                    ? 'text-amber-300'
                    : 'whitespace-pre-wrap text-slate-400'
              }
            >
              {line}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            exec(cmd)
          }}
          className="mb-3 flex items-center gap-2 rounded-md border border-edge bg-black/60 px-2.5 py-1.5 focus-within:border-cyan-glow/60"
        >
          <span className="font-mono text-[12px] text-emerald-400">$</span>
          <input
            ref={inputRef}
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder="df -h /   ·   top   ·   grep ETIMEDOUT app.log"
            className="w-full bg-transparent font-mono text-[12px] text-cyan-100 outline-none placeholder:text-slate-600"
          />
        </form>

        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[9px] tracking-[0.25em] text-slate-500">DIAGNOSTICS — EVIDENCE {discovered.length}</span>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {inv.checks.map((c) => {
            const used = c.clue && discovered.includes(c.clue)
            return (
              <button
                key={c.id}
                onClick={() => exec(c.cmd ?? c.label)}
                className={`rounded border px-2 py-1 font-mono text-[10px] transition-all ${
                  used
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                    : 'border-edge bg-panel-2/70 text-slate-300 hover:border-cyan-glow/50 hover:text-cyan-200'
                }`}
              >
                <span className="text-slate-500">$</span> {c.cmd ?? c.label}
                {used ? ' ✓' : ''}
              </button>
            )
          })}
        </div>

        <div className="mb-1 font-mono text-[9px] tracking-[0.25em] text-slate-500">DEPLOY A FIX</div>
        <div className="flex flex-col gap-2">
          {inv.fixes.map((f) => {
            const failed = tried[f.id]
            const informed = f.requires.every((r) => discovered.includes(r))
            return (
              <button
                key={f.id}
                disabled={!!failed}
                onMouseEnter={() => hoverUnlock(f.unlock ?? null)}
                onMouseLeave={() => hoverUnlock(null)}
                onClick={() => {
                  hoverUnlock(null)
                  if (informed || f.requires.length === 0) sfx.success()
                  else sfx.click()
                  attemptFix(f.id)
                }}
                className={`group rounded-lg border px-3 py-2 text-left transition-all ${
                  failed
                    ? 'border-edge opacity-40'
                    : informed
                      ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400 hover:bg-emerald-500/10'
                      : 'border-edge bg-panel-2/70 hover:border-cyan-glow/60 hover:bg-panel-2'
                }`}
              >
                <div className="text-sm font-semibold text-slate-100 group-hover:text-cyan-200">
                  <span className="mr-1.5 font-mono text-[10px] text-emerald-400">$</span>
                  {f.label}
                  {failed && <span className="ml-2 font-mono text-[9px] text-rose-400">FAILED</span>}
                  {!failed && informed && f.requires.length > 0 && <span className="ml-2 font-mono text-[9px] text-emerald-400">EVIDENCE SUPPORTS</span>}
                </div>
                {!failed && !informed && f.requires.length > 0 && (
                  <div className="mt-0.5 font-mono text-[9px] tracking-wide text-slate-500">GUT FEELING — missing {f.requires.length} piece(s) of evidence</div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
