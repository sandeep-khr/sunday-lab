import { useEffect, useMemo, useRef, useState } from 'react'
import { buildTopology, SimEngine, type LabTopologyInput } from '../../sim/engine'
import { LAB_SCENARIOS, type LabScenario } from '../../content/lab-scenarios'
import { conceptsForScenario } from '../../content/scenario-concepts'
import { useProfile } from '../../engine/profile'
import type { SimSnapshot } from '../../sim/types'
import { WrButton, WrChip, WrMeter, WrPanel } from '../system'

type SlotState = Omit<LabTopologyInput, 'trafficRps'>

const DEFAULT_SLOTS: SlotState = {
  cdn: true,
  ratelimit: false,
  lb: true,
  appCount: 2,
  appCapacity: 2500,
  cache: true,
  cacheHitRate: 0.8,
  replicas: 0,
  queueWorker: false,
  search: false,
  searchCapacity: 6000,
  rlLimit: 3000,
  dbCapacity: 4000,
}

interface Placed {
  id: string
  kind: string
  label: string
  x: number
  y: number
  w: number
  h: number
}

function layout(eng: SimEngine, slots: SlotState): Placed[] {
  const out: Placed[] = []
  let x = 20
  const col = (ids: string[], cx: number) => {
    const nodes = ids.map((id) => eng.node(id)).filter(Boolean)
    const totalH = nodes.length * 74
    let y = 210 - totalH / 2
    for (const n of nodes) {
      out.push({ id: n!.id, kind: n!.kind, label: n!.label, x: cx, y, w: 140, h: 60 })
      y += 74
    }
  }
  out.push({ id: 'users', kind: 'users', label: 'MERCHANTS', x: 16, y: 180, w: 130, h: 60 })
  x = 180
  if (slots.cdn) {
    out.push({ id: 'cdn', kind: 'cdn', label: 'CDN', x, y: 60, w: 130, h: 54 })
  }
  if (slots.ratelimit) {
    out.push({ id: 'ratelimit', kind: 'ratelimit', label: 'RATE LIMIT', x, y: slots.cdn ? 150 : 180, w: 130, h: 54 })
  }
  if (slots.lb) {
    out.push({ id: 'lb', kind: 'lb', label: 'LOAD BAL', x: 340, y: 180, w: 120, h: 60 })
  }
  col(Array.from({ length: slots.appCount }, (_, i) => `app${i}`), 490)
  if (slots.cache) out.push({ id: 'cache', kind: 'cache', label: 'REDIS', x: 660, y: 60, w: 130, h: 54 })
  out.push({ id: 'db', kind: 'db', label: 'POSTGRES', x: 660, y: 180, w: 140, h: 64 })
  if (slots.replicas > 0) {
    const ids = Array.from({ length: slots.replicas }, (_, i) => `replica${i}`)
    const nodes = ids.map((id) => eng.node(id)!).filter(Boolean)
    let y = 300
    for (const n of nodes) {
      out.push({ id: n.id, kind: 'replica', label: 'REPLICA', x: 830, y, w: 110, h: 50 })
      y += 62
    }
  }
  if (slots.queueWorker) {
    out.push({ id: 'queue', kind: 'queue', label: 'KAFKA', x: 660, y: 300, w: 140, h: 50 })
    out.push({ id: 'worker', kind: 'worker', label: 'WORKER', x: 660, y: 362, w: 140, h: 50 })
  }
  if (slots.search) out.push({ id: 'search', kind: 'search', label: 'ELASTIC', x: 490, y: 400, w: 140, h: 50 })
  return out
}

function wires(slots: SlotState): [string, string][] {
  const w: [string, string][] = []
  const entry = slots.cdn ? 'cdn' : slots.ratelimit ? 'ratelimit' : slots.lb ? 'lb' : 'app0'
  w.push(['users', entry])
  if (slots.cdn) w.push(['cdn', slots.ratelimit ? 'ratelimit' : slots.lb ? 'lb' : 'app0'])
  if (slots.ratelimit) w.push(['ratelimit', slots.lb ? 'lb' : 'app0'])
  if (slots.lb) w.push(['lb', 'app0'])
  for (let i = 1; i < slots.appCount; i++) w.push([`app${i - 1}`, `app${i}`])
  const lastApp = `app${slots.appCount - 1}`
  if (slots.cache) w.push([lastApp, 'cache'])
  w.push([lastApp, 'db'])
  for (let i = 0; i < slots.replicas; i++) w.push(['db', `replica${i}`])
  if (slots.queueWorker) {
    w.push([lastApp, 'queue'])
    w.push(['queue', 'worker'])
  }
  if (slots.search) w.push([lastApp, 'search'])
  return w
}

function checkWin(eng: SimEngine, sc: LabScenario, seconds: number): boolean {
  const w = sc.win
  if (seconds < w.afterS) return false
  const windowSnaps = eng.history.slice(-Math.round(w.windowS * 10))
  if (windowSnaps.length < Math.round(w.windowS * 10) * 0.8) return false
  return windowSnaps.every(
    (sn) =>
      sn.errorRate <= w.maxErrorRate &&
      (w.maxP95 === undefined || sn.p95 <= w.maxP95) &&
      (w.minShedded === undefined || sn.rejectedRate >= w.minShedded),
  )
}

export default function LabScreen({ onExit }: { onExit: () => void }) {
  const [scenarioId, setScenarioId] = useState(LAB_SCENARIOS[0].id)
  const [slots, setSlots] = useState<SlotState>(DEFAULT_SLOTS)
  const [running, setRunning] = useState(false)
  const [snap, setSnap] = useState<SimSnapshot | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [won, setWon] = useState(false)
  const [tS, setTS] = useState(0)
  const [traffic, setTraffic] = useState(2000)
  const engineRef = useRef<SimEngine | null>(null)
  const firedRef = useRef<Set<number>>(new Set())
  const scenario = LAB_SCENARIOS.find((x) => x.id === scenarioId) as LabScenario

  const topoInput: LabTopologyInput = useMemo(
    () => ({ ...slots, trafficRps: traffic }),
    [slots, traffic],
  )

  const reset = () => {
    const topo = buildTopology(topoInput)
    engineRef.current = new SimEngine(topo, 42)
    firedRef.current = new Set()
    setSnap(engineRef.current.step())
    setWon(false)
    setTS(0)
  }

  useEffect(reset, [topoInput])

  useEffect(() => {
    if (!won) return
    const t = setTimeout(() => setWon(false), 9000)
    return () => clearTimeout(t)
  }, [won])

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      const eng = engineRef.current
      if (!eng) return
      const s = eng.step()
      const seconds = s.t / 1000
      setTS(seconds)
      scenario.events.forEach((ev, i) => {
        if (seconds >= ev.atS && !firedRef.current.has(i)) {
          firedRef.current.add(i)
          if (ev.kind === 'spike') eng.spike(ev.mult ?? 10, ev.dur ?? 10)
          if (ev.kind === 'kill' && ev.target) eng.kill(ev.target)
          if (ev.kind === 'restore' && ev.target) eng.restore(ev.target)
        }
      })
      setSnap(s)
      if (!won && checkWin(eng, scenario, seconds)) {
        setWon(true)
        setRunning(false)
        useProfile.getState().recordLabWin(scenario.id, conceptsForScenario(scenario.id))
      }
    }, 100)
    return () => clearInterval(iv)
  }, [running, scenario, won])

  const eng = engineRef.current
  const placed = eng ? layout(eng, slots) : []
  const links = wires(slots)
  const posById = Object.fromEntries(placed.map((p) => [p.id, p]))
  const sel = selected && eng ? eng.node(selected) : null
  const selMetric = selected && snap ? snap.nodes[selected] : null

  const patchSlot = (p: Partial<SlotState>) => setSlots((s) => ({ ...s, ...p }))

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-edge bg-panel/90 px-4 py-2.5">
        <button onClick={onExit} className="rounded border border-edge px-2.5 py-1 font-mono text-[10px] tracking-widest text-slate-400 hover:border-cyan-glow/50 hover:text-cyan-200">
          ← EXIT LAB
        </button>
        <span className="font-mono text-sm font-bold tracking-widest text-cyan-300">SANDBOX LAB</span>
        <span className="font-mono text-[9px] tracking-[0.3em] text-slate-500">DISCRETE-EVENT SIMULATOR · ALPHA</span>
        <div className="ml-auto flex max-w-[70vw] items-center gap-2 overflow-x-auto pb-0.5">
          {LAB_SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setScenarioId(s.id)
                setRunning(false)
                if (s.setup) setSlots((prev) => ({ ...prev, ...s.setup }))
                if (s.traffic) setTraffic(s.traffic)
              }}
              className={`rounded border px-2 py-1 font-mono text-[10px] tracking-wider transition-colors ${
                scenarioId === s.id ? 'border-cyan-glow/60 bg-cyan-glow/10 text-cyan-200' : 'border-edge text-slate-400 hover:text-slate-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          {won && (
            <div className="absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-lg border border-emerald-400/60 bg-panel/95 px-8 py-4 text-center glow-cyan">
              <div className="font-mono text-[10px] tracking-[0.4em] text-emerald-400">CHALLENGE COMPLETE</div>
              <p className="mt-1 max-w-sm text-[12px] leading-snug text-slate-200">{scenario.winText}</p>
            </div>
          )}

          <svg viewBox="0 0 980 470" className="h-full w-full">
            {links.map(([a, b], i) => {
              const pa = posById[a]
              const pb = posById[b]
              if (!pa || !pb) return null
              const x1 = pa.x + pa.w
              const y1 = pa.y + pa.h / 2
              const x2 = pb.x
              const y2 = pb.y + pb.h / 2
              const mid = (x1 + x2) / 2
              return <path key={i} d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`} className="wire wire-active" fill="none" />
            })}
            {placed.map((p) => {
              const m = snap?.nodes[p.id]
              const util = m?.utilization ?? 0
              const stroke = m && !m.up ? '#fb4d63' : util > 0.92 ? '#fbbf24' : util > 0 ? '#2dd4bf99' : '#24354f'
              return (
                <g key={p.id} transform={`translate(${p.x},${p.y})`} onClick={() => setSelected(p.id)} style={{ cursor: 'pointer' }}>
                  <rect width={p.w} height={p.h} rx={9} fill="var(--color-panel)" stroke={selected === p.id ? '#22d3ee' : stroke} strokeWidth={selected === p.id ? 2 : 1.2} />
                  <text x={p.w / 2} y={p.h / 2 - 4} textAnchor="middle" className="node-label" fontSize={10.5} fontWeight={700} fill="#a5ecf7">
                    {p.label}
                  </text>
                  {m && (
                    <>
                      <text x={p.w / 2} y={p.h / 2 + 12} textAnchor="middle" className="node-label" fontSize={8.5} fill={m.up ? '#5b739c' : '#fb4d63'}>
                        {m.up ? `${Math.round(m.rpsIn).toLocaleString()} rps · ρ ${Math.round(util * 100)}%` : 'DOWN'}
                      </text>
                      <rect x={8} y={p.h - 7} width={p.w - 16} height={3} rx={1.5} fill="#1e2d47" />
                      <rect x={8} y={p.h - 7} width={(p.w - 16) * Math.min(1, util)} height={3} rx={1.5} fill={util > 0.92 ? '#fb4d63' : util > 0.75 ? '#fbbf24' : '#34d399'} />
                    </>
                  )}
                </g>
              )
            })}
          </svg>

          {snap && (
            <div className="absolute bottom-3 left-3 flex gap-2">
              <WrChip label="RPS" value={Math.round(snap.trafficRps).toLocaleString()} />
              <WrChip label="P95" value={`${Math.round(snap.p95)}ms`} tone={snap.p95 > 500 ? '#fbbf24' : '#34d399'} />
              <WrChip label="ERRORS" value={`${(snap.errorRate * 100).toFixed(1)}%`} tone={snap.errorRate > 0.05 ? '#fb4d63' : '#34d399'} />
              <WrChip label="SHEDDED" value={`${(snap.rejectedRate * 100).toFixed(1)}%`} tone="#8b9dc3" />
            </div>
          )}
        </div>

        <aside className="flex w-[330px] shrink-0 flex-col gap-3 overflow-y-auto border-l border-edge bg-panel/60 p-3">
          <WrPanel
            title={`MISSION — ${scenario.name}`}
            right={<span className="font-mono text-[10px] text-slate-500">t = {tS.toFixed(1)}s</span>}
          >
            <p className="text-[12px] leading-snug text-slate-300">{scenario.brief}</p>
            <p className="mt-1.5 border-l-2 border-cyan-glow/50 pl-2 font-mono text-[10px] leading-snug text-cyan-300/80">LESSON: {scenario.teach}</p>
            {won && (
              <div className="mt-2 rounded-md border border-emerald-500/50 bg-emerald-500/10 p-2">
                <div className="font-mono text-[9px] tracking-[0.3em] text-emerald-400">CHALLENGE COMPLETE</div>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-300">{scenario.winText}</p>
              </div>
            )}
            <div className="mt-2.5 flex items-center gap-2">
              <WrButton variant={running ? 'warn' : 'primary'} onClick={() => setRunning((r) => !r)}>
                {running ? '❚❚ PAUSE' : '▶ RUN SIM'}
              </WrButton>
              <WrButton onClick={reset}>↺ RESET</WrButton>
            </div>
          </WrPanel>

          <WrPanel title="TOPOLOGY">
            <div className="space-y-2 text-[12px]">
              <Toggle label="CDN edge" on={slots.cdn} onChange={(v) => patchSlot({ cdn: v })} />
              <Toggle label="Rate limiter" on={slots.ratelimit} onChange={(v) => patchSlot({ ratelimit: v })} />
              <Toggle label="Load balancer" on={slots.lb} onChange={(v) => patchSlot({ lb: v })} />
              <Toggle label="Redis cache" on={slots.cache} onChange={(v) => patchSlot({ cache: v })} />
              <Toggle label="Kafka + worker" on={slots.queueWorker} onChange={(v) => patchSlot({ queueWorker: v })} />
              <Toggle label="Elasticsearch" on={slots.search} onChange={(v) => patchSlot({ search: v })} />
            </div>
            <div className="mt-3 space-y-3">
              <Slider label={`App servers: ${slots.appCount}`} min={1} max={8} value={slots.appCount} onChange={(v) => patchSlot({ appCount: v })} />
              <Slider label={`App capacity: ${slots.appCapacity} rps ea`} min={500} max={6000} step={250} value={slots.appCapacity} onChange={(v) => patchSlot({ appCapacity: v })} />
              <Slider label={`Replicas: ${slots.replicas}`} min={0} max={4} value={slots.replicas} onChange={(v) => patchSlot({ replicas: v })} />
              <Slider label={`DB capacity: ${slots.dbCapacity} rps`} min={1000} max={12000} step={500} value={slots.dbCapacity} onChange={(v) => patchSlot({ dbCapacity: v })} />
              {slots.cache && <Slider label={`Cache hit rate: ${Math.round(slots.cacheHitRate * 100)}%`} min={0} max={0.98} step={0.02} value={slots.cacheHitRate} onChange={(v) => patchSlot({ cacheHitRate: v })} />}
              {slots.ratelimit && <Slider label={`Rate limit: ${slots.rlLimit?.toLocaleString()} rps`} min={500} max={40000} step={500} value={slots.rlLimit ?? 3000} onChange={(v) => patchSlot({ rlLimit: v })} />}
              {slots.search && <Slider label={`ES capacity: ${slots.searchCapacity?.toLocaleString()} rps`} min={1000} max={20000} step={500} value={slots.searchCapacity ?? 6000} onChange={(v) => patchSlot({ searchCapacity: v })} />}
            </div>
          </WrPanel>

          <WrPanel title="TRAFFIC">
            <Slider label={`Baseline: ${traffic.toLocaleString()} rps`} min={200} max={20000} step={200} value={traffic} onChange={(v) => { setTraffic(v); engineRef.current?.setTraffic(v) }} />
            <div className="mt-2">
              <WrButton variant="danger" onClick={() => engineRef.current?.spike(30, 8)}>
                ⚡ INJECT 30x SPIKE (8s)
              </WrButton>
            </div>
          </WrPanel>

          {sel && selMetric && (
            <WrPanel title={`INSPECT — ${sel.label}`}>
              <div className="space-y-1.5">
                <WrMeter label="UTILIZATION" value={selMetric.utilization} />
                <WrMeter label="HEALTH" value={selMetric.up ? 1 : 0} tone={selMetric.up ? '#34d399' : '#fb4d63'} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[10px] text-slate-400">
                <span>in: {Math.round(selMetric.rpsIn).toLocaleString()} rps</span>
                <span>lat: {selMetric.latencyMs.toFixed(1)}ms</span>
                <span>err/s: {Math.round(selMetric.errors)}</span>
                {sel.kind === 'queue' && <span>backlog: {Math.round(selMetric.queueDepth)}</span>}
              </div>
              {sel.kind !== 'users' && (
                <div className="mt-3 flex gap-2">
                  {selMetric.up ? (
                    <WrButton variant="danger" onClick={() => { engineRef.current?.kill(sel.id); setSelected(null) }}>
                      KILL NODE
                    </WrButton>
                  ) : (
                    <WrButton variant="primary" onClick={() => engineRef.current?.restore(sel.id)}>
                      RESTORE NODE
                    </WrButton>
                  )}
                </div>
              )}
              <p className="mt-2 text-[10px] leading-snug text-slate-500">Click any node on the map to inspect. Kill things. That is the point.</p>
            </WrPanel>
          )}
        </aside>
      </div>
    </div>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center justify-between rounded-md border border-edge bg-panel-2/50 px-3 py-1.5 text-left transition-colors hover:border-cyan-glow/40">
      <span className="text-slate-300">{label}</span>
      <span className={`h-4 w-8 rounded-full border transition-colors ${on ? 'border-cyan-glow/60 bg-cyan-glow/30' : 'border-edge bg-edge'}`}>
        <span className={`block h-3 w-3 translate-y-[1.5px] rounded-full bg-slate-300 transition-transform ${on ? 'translate-x-[17px]' : 'translate-x-[3px]'}`} />
      </span>
    </button>
  )
}

function Slider({ label, min, max, step = 1, value, onChange }: { label: string; min: number; max: number; step?: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] tracking-widest text-slate-500">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-edge accent-cyan-400"
      />
    </label>
  )
}
