import type { LabTopologyInput } from '../sim/engine'

export interface LabEvent {
  atS: number
  kind: 'spike' | 'kill' | 'restore'
  target?: string
  mult?: number
  dur?: number
}

export interface LabWin {
  afterS: number
  maxErrorRate: number
  maxP95?: number
  minShedded?: number
  windowS: number
}

export interface LabScenario {
  id: string
  tier: 1 | 2 | 3 | 4 | 5
  name: string
  brief: string
  teach: string
  winText: string
  setup: Partial<LabTopologyInput>
  traffic?: number
  events: LabEvent[]
  win: LabWin
}

export const LAB_SCENARIOS: LabScenario[] = [
  {
    id: 't1-first',
    tier: 1,
    name: 'T1 · FIRST TRAFFIC',
    brief: '500 rps on a single app server and a database. Keep errors under 1% and p95 under 250ms for 15 seconds.',
    teach: 'Baseline: a correctly sized small system is boring. Boring is the goal.',
    winText: 'Healthy. Low utilization, flat latency. Memorize this shape — everything else is this under stress.',
    setup: { cdn: false, ratelimit: false, lb: false, appCount: 1, cache: false, replicas: 0, queueWorker: false, search: false, dbCapacity: 4000, appCapacity: 2500 },
    traffic: 500,
    events: [],
    win: { afterS: 15, maxErrorRate: 0.01, maxP95: 250, windowS: 15 },
  },
  {
    id: 't2-divorce',
    tier: 1,
    name: 'T1 · THE SQUEEZED DATABASE',
    brief: '1,500 rps is melting the primary (ρ pinned near 100%). Add a cache or replicas to pull DB utilization under 80% for 10 seconds.',
    teach: 'Reads dominate. A cache absorbs hot reads; replicas multiply read capacity. This is the Great Divorce, quantified.',
    winText: 'Database utilization down, latency flat. You just did chapter 3 with math instead of vibes.',
    setup: { cdn: false, ratelimit: false, lb: true, appCount: 2, cache: false, replicas: 0, queueWorker: false, search: false, dbCapacity: 1600 },
    traffic: 1500,
    events: [],
    win: { afterS: 10, maxErrorRate: 0.02, windowS: 10, maxP95: 600 },
  },
  {
    id: 't2-stampede',
    tier: 2,
    name: 'T2 · CACHE ON LIFE SUPPORT',
    brief: 'Your cache is carrying 85% of reads. At t=8s it dies. Survive with errors under 12% after t=10 — you will need replicas AND enough DB headroom.',
    teach: 'Caches are speed, not durability. Always size the miss path (DB + replicas) for full traffic.',
    winText: 'The cache died and the platform limped but lived. The miss path saved you — that is the lesson.',
    setup: { cdn: false, ratelimit: false, lb: true, appCount: 3, cache: true, cacheHitRate: 0.85, replicas: 2, queueWorker: false, search: false, dbCapacity: 6000 },
    traffic: 4000,
    events: [{ atS: 8, kind: 'kill', target: 'cache' }],
    win: { afterS: 10, maxErrorRate: 0.12, windowS: 8 },
  },
  {
    id: 't2-bots',
    tier: 2,
    name: 'T2 · THE BOT FLOOD',
    brief: 'Of 9,000 rps, two-thirds is scrapers. Turn on the rate limiter (limit ≈ 3,000) and shed more than 55% of traffic while keeping p95 under 500ms.',
    teach: 'Reject junk at the edge BEFORE it eats database connections. 429s are cheap; overload is expensive.',
    winText: 'Six thousand bots bounced at the door, merchants never noticed. The bouncer earns his wage.',
    setup: { cdn: false, ratelimit: false, lb: true, appCount: 3, cache: true, cacheHitRate: 0.7, replicas: 1, queueWorker: false, search: false, dbCapacity: 5000, rlLimit: 3000 },
    traffic: 9000,
    events: [],
    win: { afterS: 10, maxErrorRate: 0.05, minShedded: 0.55, maxP95: 500, windowS: 8 },
  },
  {
    id: 't3-writes',
    tier: 3,
    name: 'T3 · WRITE STORM',
    brief: 'Order writes are drowning Postgres. Enable Kafka + worker so 40% of write work becomes async, and hold DB utilization under 75%.',
    teach: 'Durable queues turn synchronous write walls into smooth async pipelines. Latency for events, survival for the core.',
    winText: 'Writes flow into the log, workers drain at their own pace, the primary stopped sweating. Kafka earns its keep.',
    setup: { cdn: true, ratelimit: false, lb: true, appCount: 3, cache: true, cacheHitRate: 0.75, replicas: 1, queueWorker: false, search: false, dbCapacity: 4500 },
    traffic: 5000,
    events: [],
    win: { afterS: 10, maxErrorRate: 0.03, maxP95: 450, windowS: 8 },
  },
  {
    id: 't3-search',
    tier: 3,
    name: 'T3 · SEARCH SINKHOLE',
    brief: 'Search is 25% of all work and Elasticsearch is undersized (2,000 rps). Raise ES capacity to 6,000+ and keep p95 under 350ms.',
    teach: 'One slow dependency poisons every request it touches. Scale the specialist, not the whole fleet.',
    winText: 'Search went from anchor to asset. Specialized stores need specialized capacity.',
    setup: { cdn: true, ratelimit: false, lb: true, appCount: 3, cache: true, cacheHitRate: 0.75, replicas: 1, queueWorker: false, search: true, searchCapacity: 2000, dbCapacity: 5000 },
    traffic: 4500,
    events: [],
    win: { afterS: 10, maxErrorRate: 0.03, maxP95: 350, windowS: 8 },
  },
  {
    id: 't4-killprimary',
    tier: 4,
    name: 'T4 · PRIMARY DOWN',
    brief: 'At t=6s the primary database dies. With replicas serving reads, keep total errors under 20% after t=9. Writes will fail — partial survival is the win.',
    teach: 'Failover reality: reads survive on replicas, writes degrade. Design for graceful failure, not perfection.',
    winText: 'Primary burned, reads kept flowing, writes failed loudly instead of corrupting data. That is graceful degradation.',
    setup: { cdn: true, ratelimit: false, lb: true, appCount: 3, cache: true, cacheHitRate: 0.7, replicas: 2, queueWorker: false, search: false, dbCapacity: 5000 },
    traffic: 4000,
    events: [{ atS: 6, kind: 'kill', target: 'db' }],
    win: { afterS: 9, maxErrorRate: 0.2, windowS: 6 },
  },
  {
    id: 't4-blackfriday',
    tier: 4,
    name: 'T4 · BLACK FRIDAY',
    brief: 'At t=8s traffic spikes 60x for 20 seconds. Combine EVERYTHING — rate limiter at 12k, big app pool, cache, replicas — and keep errors under 5% while spiked.',
    teach: 'Surviving real spikes is layering: shed, absorb, scale, repeat.',
    winText: '60x traffic and the graphs barely flinched. This is the Shark Tank level, solved with architecture.',
    setup: { cdn: true, ratelimit: true, rlLimit: 12000, lb: true, appCount: 5, appCapacity: 4000, cache: true, cacheHitRate: 0.85, replicas: 2, queueWorker: true, search: false, dbCapacity: 9000 },
    traffic: 2000,
    events: [{ atS: 8, kind: 'spike', mult: 60, dur: 20 }],
    win: { afterS: 10, maxErrorRate: 0.05, windowS: 18 },
  },
  {
    id: 't5-halfmillion',
    tier: 5,
    name: 'T5 · HALF A MILLION',
    brief: 'Hold 25,000 rps sustained for 20 seconds: errors < 1%, p95 < 500ms. Every layer matters. This is a 500K-merchant platform.',
    teach: 'Capacity planning: every tier must clear its share. One bottleneck ruins six healthy layers.',
    winText: 'Half a million merchants, steady graphs. You can size a platform now — with numbers, not hope.',
    setup: { cdn: true, ratelimit: true, rlLimit: 30000, lb: true, appCount: 6, appCapacity: 5000, cache: true, cacheHitRate: 0.88, replicas: 3, queueWorker: true, search: true, searchCapacity: 8000, dbCapacity: 14000 },
    traffic: 25000,
    events: [],
    win: { afterS: 20, maxErrorRate: 0.01, maxP95: 500, windowS: 20 },
  },
  {
    id: 't5-meltdown',
    tier: 5,
    name: 'T5 · CASCADE CHALLENGE',
    brief: 'At t=6s the DB dies; at t=14s a 15x spike hits the wounded system. Keep errors under 25% through t=20. Replicas + queue + shedder.',
    teach: 'Real incidents cascade. Survive the first failure, then absorb the spike on a degraded system.',
    winText: 'A cascade survived. Incident commanders are made in exactly this kind of minute.',
    setup: { cdn: true, ratelimit: true, rlLimit: 9000, lb: true, appCount: 4, appCapacity: 4000, cache: true, cacheHitRate: 0.8, replicas: 2, queueWorker: true, search: false, dbCapacity: 8000 },
    traffic: 3500,
    events: [
      { atS: 6, kind: 'kill', target: 'db' },
      { atS: 14, kind: 'spike', mult: 15, dur: 8 },
    ],
    win: { afterS: 15, maxErrorRate: 0.25, windowS: 5 },
  },
]
