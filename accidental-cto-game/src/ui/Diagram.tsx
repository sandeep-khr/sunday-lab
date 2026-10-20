import { useEffect, useRef } from 'react'
import { capacityOf, loadOf, p95ms } from '../engine/state'
import { useGame } from '../engine/store'

interface NodeDef {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  sub?: string
  comp?: string
  alwaysOn?: boolean
}

const NODES: NodeDef[] = [
  { id: 'merchants', x: 28, y: 300, w: 150, h: 88, label: 'MERCHANTS', alwaysOn: true },
  { id: 'ratelimit', x: 232, y: 236, w: 132, h: 50, label: 'RATE LIMITER', comp: 'ratelimit' },
  { id: 'cdn', x: 232, y: 128, w: 152, h: 58, label: 'CDN EDGE', sub: 'static · nearby PoP', comp: 'cdn' },
  { id: 'lb', x: 248, y: 318, w: 132, h: 70, label: 'LOAD BALANCER', comp: 'lb' },
  { id: 'realtime', x: 478, y: 116, w: 140, h: 52, label: 'WEBSOCKETS', comp: 'realtime' },
  { id: 'app1', x: 478, y: 208, w: 140, h: 62, label: 'APP', comp: 'lb' },
  { id: 'app2', x: 478, y: 308, w: 140, h: 72, label: 'APP', alwaysOn: true },
  { id: 'app3', x: 478, y: 420, w: 140, h: 62, label: 'APP', comp: 'lb' },
  { id: 'redis', x: 700, y: 168, w: 150, h: 58, label: 'REDIS', sub: 'hot reads ~2ms', comp: 'redis' },
  { id: 'db', x: 716, y: 300, w: 162, h: 90, label: 'POSTGRES', alwaysOn: true, comp: 'db_split' },
  { id: 'replica1', x: 948, y: 226, w: 122, h: 56, label: 'REPLICA', comp: 'replicas' },
  { id: 'replica2', x: 948, y: 408, w: 122, h: 56, label: 'REPLICA', comp: 'replicas' },
  { id: 'kafka', x: 700, y: 462, w: 170, h: 58, label: 'KAFKA', sub: 'durable order log', comp: 'kafka' },
  { id: 'nosql', x: 640, y: 542, w: 170, h: 54, label: 'DOCUMENT STORE', comp: 'nosql' },
  { id: 'es', x: 452, y: 542, w: 160, h: 56, label: 'ELASTICSEARCH', comp: 'es' },
  { id: 'staging', x: 30, y: 610, w: 186, h: 60, label: 'STAGING', sub: 'rehearse before prod', comp: 'staging' },
  { id: 'monitoring', x: 248, y: 610, w: 186, h: 60, label: 'MONITORING', sub: 'golden signals', comp: 'monitoring' },
]

const ZONES = [
  { x: 14, y: 96, w: 196, h: 592, label: 'CLIENTS & EDGE' },
  { x: 226, y: 96, w: 178, h: 330, label: 'DELIVERY' },
  { x: 452, y: 84, w: 192, h: 534, label: 'COMPUTE' },
  { x: 668, y: 84, w: 428, h: 470, label: 'DATA LAYER' },
]

interface EdgeDef {
  id: string
  d: string
  dash?: boolean
  on: (u: Set<string>) => boolean
}

const EDGES: EdgeDef[] = [
  { id: 'e_m_cdn', d: 'M103,300 L103,157 L230,157', on: (u) => u.has('cdn') && u.has('mvp') },
  { id: 'e_cdn_miss', d: 'M308,186 L308,316', dash: true, on: (u) => u.has('cdn') && u.has('mvp') },
  { id: 'e_m_lb', d: 'M178,340 L246,344', on: (u) => u.has('lb') && !u.has('cdn') && u.has('mvp') },
  { id: 'e_m_app', d: 'M178,350 L476,346', on: (u) => !u.has('lb') && !u.has('cdn') && u.has('mvp') },
  { id: 'e_lb_a1', d: 'M380,338 L428,338 L428,239 L476,239', on: (u) => u.has('lb') },
  { id: 'e_lb_a2', d: 'M380,353 L476,346', on: (u) => u.has('lb') },
  { id: 'e_lb_a3', d: 'M380,368 L428,368 L428,451 L476,451', on: (u) => u.has('lb') },
  { id: 'e_a1_redis', d: 'M618,225 L659,225 L659,197 L698,197', on: (u) => u.has('redis') },
  { id: 'e_redis_db', d: 'M775,226 L775,298', on: (u) => u.has('redis') },
  { id: 'e_a_db1', d: 'M618,240 L668,240 L668,322 L714,325', on: (u) => u.has('db_split') || u.has('mvp') },
  { id: 'e_a_db2', d: 'M618,344 L712,346', on: (u) => u.has('db_split') || u.has('mvp') },
  { id: 'e_a_db3', d: 'M618,450 L668,450 L668,370 L714,368', on: (u) => u.has('kafka') || u.has('microservice') },
  { id: 'e_a3_kafka', d: 'M618,462 L659,480 L698,484', on: (u) => u.has('kafka') },
  { id: 'e_kafka_db', d: 'M785,460 L785,392', on: (u) => u.has('kafka') },
  { id: 'e_a2_es', d: 'M548,382 L548,540', dash: true, on: (u) => u.has('es') },
  { id: 'e_db_r1', d: 'M878,326 L946,258', on: (u) => u.has('replicas') },
  { id: 'e_db_r2', d: 'M878,372 L946,432', on: (u) => u.has('replicas') },
]

function packetCount(users: number): number {
  return Math.max(1, Math.min(7, 1 + Math.floor(users / 9)))
}

function PacketLayer({ edges, alert, users }: { edges: EdgeDef[]; alert: boolean; users: number }) {
  const groupRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const layer = groupRef.current
    if (!layer) return
    const ns = 'http://www.w3.org/2000/svg'
    const moving: { el: SVGCircleElement; path: SVGPathElement; len: number; off: number }[] = []
    const n = packetCount(users)
    for (const e of edges) {
      const p = document.getElementById(`path-${e.id}`) as SVGPathElement | null
      if (!p) continue
      const len = p.getTotalLength()
      for (let i = 0; i < n; i++) {
        const c = document.createElementNS(ns, 'circle')
        c.setAttribute('r', e.dash ? '2.2' : '3')
        c.setAttribute('class', e.dash ? 'packet packet-dim' : 'packet')
        layer.appendChild(c)
        moving.push({ el: c, path: p, len, off: Math.random() * len })
      }
    }
    let raf = 0
    let last = performance.now()
    let travel = 0
    const speed = 0.05 + Math.min(users / 2200, 0.05)
    const step = (now: number) => {
      travel += (now - last) * speed
      last = now
      for (const m of moving) {
        const d = ((m.off + travel) % m.len + m.len) % m.len
        const pt = m.path.getPointAtLength(d)
        m.el.setAttribute('transform', `translate(${pt.x},${pt.y})`)
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      for (const m of moving) m.el.remove()
    }
  }, [edges, users])

  return <g className={alert ? 'packets-alert' : undefined} ref={groupRef} />
}

function Icon({ kind }: { kind: string }) {
  switch (kind) {
    case 'merchants':
      return (
        <g stroke="#67e8f9" strokeWidth="1.6" fill="none">
          <circle cx="0" cy="0" r="8" />
          <path d="M-8,0 H8 M0,-8 C3,-4 3,4 0,8 M0,-8 C-3,-4 -3,4 0,8" />
        </g>
      )
    case 'db':
      return (
        <g stroke="#67e8f9" strokeWidth="1.6" fill="none">
          <ellipse cx="0" cy="-5" rx="7" ry="3" />
          <path d="M-7,-5 V5 A7,3 0 0 0 7,5 V-5" />
          <path d="M-7,0 A7,3 0 0 0 7,0" />
        </g>
      )
    case 'cache':
      return <path d="M2,-8 L-5,1 H-1 L-2,8 L5,-1 H1 Z" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1" />
    case 'queue':
      return (
        <g fill="#67e8f9">
          <rect x="-7" y="-6" width="14" height="3" rx="1.5" />
          <rect x="-7" y="-1" width="10" height="3" rx="1.5" />
          <rect x="-7" y="4" width="12" height="3" rx="1.5" />
        </g>
      )
    case 'search':
      return (
        <g stroke="#67e8f9" strokeWidth="1.8" fill="none">
          <circle cx="-1" cy="-1" r="5" />
          <path d="M3,3 L8,8" />
        </g>
      )
    case 'shield':
      return <path d="M0,-8 L7,-5 V1 C7,5 4,8 0,9 C-4,8 -7,5 -7,1 V-5 Z" fill="none" stroke="#34d399" strokeWidth="1.6" />
    case 'pulse':
      return <path d="M-8,0 H-3 L-1,-5 L2,5 L4,0 H8" fill="none" stroke="#fbbf24" strokeWidth="1.8" />
    case 'split':
      return (
        <g stroke="#67e8f9" strokeWidth="1.6" fill="none">
          <path d="M-7,0 H0 M0,0 L6,-5 M0,0 L6,5" />
          <circle cx="7.5" cy="-5" r="1.8" fill="#67e8f9" />
          <circle cx="7.5" cy="5" r="1.8" fill="#67e8f9" />
        </g>
      )
    default:
      return (
        <g stroke="#67e8f9" strokeWidth="1.6" fill="none">
          <rect x="-7" y="-6" width="14" height="12" rx="2" />
          <circle cx="0" cy="0" r="2.4" />
        </g>
      )
  }
}

function iconFor(n: NodeDef): string {
  switch (n.id) {
    case 'merchants':
      return 'merchants'
    case 'cdn':
      return 'merchants'
    case 'redis':
      return 'cache'
    case 'db':
    case 'replica1':
    case 'replica2':
      return 'db'
    case 'kafka':
      return 'queue'
    case 'es':
      return 'search'
    case 'staging':
      return 'shield'
    case 'monitoring':
      return 'pulse'
    case 'lb':
      return 'split'
    default:
      return 'server'
  }
}

export default function Diagram({ alert }: { alert: boolean }) {
  const unlockedList = useGame((s) => s.game.unlocked)
  const game = useGame((s) => s.game)
  const month = useGame((s) => s.game.month)
  const previewUnlock = useGame((s) => s.previewUnlock)
  const openConcept = useGame((s) => s.openConcept)
  const conceptOpen = useGame((s) => s.conceptOpen)
  const unlocked = new Set(unlockedList)
  const activeEdges = EDGES.filter((e) => e.on(unlocked))
  const hasLb = unlocked.has('lb')
  const hasK8s = unlocked.has('k8s')
  const strain = loadOf(game) / Math.max(capacityOf(game), 1)
  const rps = Math.round(loadOf(game) * 1000)
  const cacheHit = unlocked.has('redis') ? Math.min(96, 40 + game.speed / 2 + (unlocked.has('cdn') ? 12 : 0)) : 0
  const errRate = Math.max(0, ((100 - game.reliability) / 3)).toFixed(2)

  return (
    <div className="relative h-full w-full">
      <div className="pointer-events-none absolute left-3 top-2 z-10 flex gap-4 rounded-lg border border-edge bg-panel/80 px-3 py-1.5 font-mono text-[10px] backdrop-blur-sm">
        <Metric k="RPS" v={rps.toLocaleString()} tone="#67e8f9" />
        <Metric k="P95" v={`${p95ms(game)}ms`} tone={p95ms(game) > 400 ? '#fbbf24' : '#34d399'} />
        <Metric k="ERR" v={`${errRate}%`} tone={Number(errRate) > 5 ? '#fb4d63' : '#34d399'} />
        {unlocked.has('redis') && <Metric k="CACHE HIT" v={`${Math.round(cacheHit)}%`} tone="#34d399" />}
        <Metric k="STRAIN" v={`${Math.round(strain * 100)}%`} tone={strain > 0.95 ? '#fb4d63' : strain > 0.85 ? '#fbbf24' : '#34d399'} />
      </div>
      <svg viewBox="0 0 1100 700" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {ZONES.map((z) => (
          <g key={z.label}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={14} fill="rgba(30,45,71,0.16)" stroke="rgba(30,45,71,0.5)" strokeDasharray="3 6" />
            <text x={z.x + z.w / 2} y={z.y - 6} textAnchor="middle" className="node-label" fontSize={11} letterSpacing={3} fill="#3d5478">
              {z.label}
            </text>
          </g>
        ))}

        {hasK8s && (
          <g>
            <rect x={464} y={196} width={168} height={300} rx={16} fill="rgba(34,211,238,0.03)" stroke="rgba(34,211,238,0.35)" strokeDasharray="7 5" />
            <text x={548} y={188} textAnchor="middle" className="node-label" fontSize={10} fill="rgba(34,211,238,0.65)">
              KUBERNETES · SELF-HEALING
            </text>
          </g>
        )}

        {activeEdges.map((e) => (
          <path
            key={e.id}
            id={`path-${e.id}`}
            d={e.d}
            className={`wire ${e.dash ? 'wire-dim' : ''} ${alert ? 'wire-alert' : 'wire-active'}`}
            markerEnd={alert ? 'url(#arrow-alert)' : 'url(#arrow)'}
          />
        ))}

        <PacketLayer edges={activeEdges} alert={alert} users={game.users} />

        {unlocked.has('edge') &&
          [
            [16, 250],
            [200, 262],
            [10, 430],
            [206, 442],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={7} fill="var(--color-panel)" stroke="rgba(52,211,153,0.6)" strokeDasharray="3 2" />
              <circle cx={x} cy={y} r={2.2} fill="#34d399" />
            </g>
          ))}
        {unlocked.has('edge') && (
          <text x={110} y={278} textAnchor="middle" className="node-label" fontSize={9} fill="rgba(52,211,153,0.75)">
            EDGE REGIONS LIVE
          </text>
        )}

        {NODES.map((n) => {
          if ((n.id === 'app1' || n.id === 'app3') && !hasLb) return null
          if (n.id === 'app2' && !unlocked.has('mvp')) return null
          const isOn = n.alwaysOn === true || (n.comp ? unlocked.has(n.comp) : true)
          const ghost = !isOn
          const previewing = !!n.comp && ghost && n.comp === previewUnlock
          const selected = !!n.comp && conceptOpen === n.comp
          const ringColor = ghost
            ? previewing
              ? '#fbbf24'
              : '#24354f'
            : alert
              ? '#fb4d63'
              : strain > 0.92
                ? '#fbbf24'
                : '#2dd4bf99'
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              opacity={ghost ? (previewing ? 0.8 : 0.35) : 1}
              onClick={() => {
                if (!ghost && n.comp) openConcept(conceptOpen === n.comp ? null : n.comp)
              }}
              style={{ cursor: !ghost && n.comp ? 'pointer' : 'default' }}
            >
              <title>{!ghost && n.comp ? `Click to learn about this component` : ''}</title>
              {(selected || (previewing && ghost)) && (
                <rect x={-5} y={-5} width={n.w + 10} height={n.h + 10} rx={13} fill="none" stroke={previewing && ghost ? '#fbbf24' : '#22d3ee'} strokeOpacity={0.5} strokeWidth={1.5} />
              )}
              <rect
                width={n.w}
                height={n.h}
                rx={11}
                fill="var(--color-panel)"
                stroke={ringColor}
                strokeWidth={previewing ? 2 : 1.2}
                strokeDasharray={ghost ? '5 4' : undefined}
              />
              {!ghost && <rect x={1.2} y={1.2} width={n.w - 2.4} height={n.h - 2.4} rx={10} fill="none" stroke="rgba(34,211,238,0.14)" />}
              <g transform={`translate(20,${n.h / 2})`}>
                <Icon kind={iconFor(n)} />
              </g>
              <text
                x={38}
                y={ghost ? n.h / 2 + 1 : n.h / 2 - (n.sub ? 3 : 0)}
                dominantBaseline="middle"
                className="node-label"
                fontSize={n.label.length > 12 ? 9.5 : n.label.length > 8 ? 11 : 12.5}
                fontWeight={700}
                fill={ghost ? (previewing ? '#fbbf24' : '#3d5478') : '#a5ecf7'}
              >
                {ghost ? '? ? ?' : nodeLabel(n, unlocked)}
              </text>
              {!ghost && n.sub && (
                <text x={38} y={n.h / 2 + 13} className="node-label" fontSize={8.5} fill="#5b739c">
                  {subLabel(n, unlocked) || n.sub}
                </text>
              )}
              {ghost && !previewing && (
                <text x={38} y={n.h / 2 + 12} className="node-label" fontSize={8} fill="#33507a">
                  UNDISCOVERED
                </text>
              )}
              {!ghost && n.comp && (
                <g transform={`translate(${n.w - 13},12)`}>
                  <circle r={6.5} fill="rgba(34,211,238,0.12)" stroke="rgba(34,211,238,0.4)" strokeWidth={0.8} />
                  <text textAnchor="middle" dominantBaseline="central" fontSize={8.5} fontWeight={700} fill="#67e8f9">
                    i
                  </text>
                </g>
              )}
            </g>
          )
        })}

        <text x={550} y={692} textAnchor="middle" className="node-label" fontSize={11.5} fill="#5b739c">
          MONTH {month} · {fmtUsers(game.users)} MERCHANTS ONLINE · LOAD {Math.round(loadOf(game))}K / CAPACITY {capacityOf(game)}K
          {unlocked.has('enterprise') ? ' · ENTERPRISE ACTIVE' : ''}
        </text>
        <text x={550} y={20} textAnchor="middle" className="node-label" fontSize={10} fill="#33507a" letterSpacing={2}>
          CLICK ANY UNLOCKED COMPONENT TO LEARN HOW IT WORKS
        </text>
      </svg>
    </div>
  )
}

function nodeLabel(n: NodeDef, u: Set<string>): string {
  if (n.label !== 'APP') return n.label
  return u.has('docker') ? 'CONTAINER ×N' : 'APP'
}

function subLabel(n: NodeDef, u: Set<string>): string {
  switch (n.id) {
    case 'db':
      return u.has('sharding') ? 'SHARDED · CONSISTENT HASH' : u.has('bare_metal') ? 'OWNED METAL · TUNED' : 'PRIMARY · TUNED'
    case 'redis':
      return 'hot reads ~2ms'
    case 'kafka':
      return 'durable order log'
    case 'staging':
      return 'deploys rehearse here'
    case 'cdn':
      return 'assets served nearby'
    case 'nosql':
      return 'eventual · always writable'
    default:
      return ''
  }
}

function Metric({ k, v, tone }: { k: string; v: string; tone: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[8px] tracking-[0.2em] text-slate-500">{k}</span>
      <span className="font-bold" style={{ color: tone }}>
        {v}
      </span>
    </span>
  )
}

function fmtUsers(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}M` : `${Math.round(v)}K`
}
