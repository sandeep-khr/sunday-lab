import { makeNode } from './catalog'
import { Rng } from './rng'
import type { NodeMetric, SimNode, SimSnapshot, Topology } from './types'

const TICK_MS = 100
const HISTORY = 400
const QUEUE_CAP = 20000

interface NodeRuntime {
  node: SimNode
  rpsIn: number
  errors: number
  rejected: number
  queueDepth: number
  latencyMs: number
  utilization: number
}

export interface LabTopologyInput {
  cdn: boolean
  ratelimit: boolean
  lb: boolean
  appCount: number
  appCapacity: number
  cache: boolean
  cacheHitRate: number
  replicas: number
  queueWorker: boolean
  search: boolean
  searchCapacity?: number
  rlLimit?: number
  dbCapacity: number
  trafficRps: number
}

export function buildTopology(input: LabTopologyInput): Topology {
  const nodes: SimNode[] = [makeNode('users', 'users')]
  if (input.cdn) nodes.push(makeNode('cdn', 'cdn'))
  if (input.ratelimit) {
    const rl = makeNode('ratelimit', 'ratelimit')
    if (input.rlLimit) rl.config.limit = input.rlLimit
    nodes.push(rl)
  }
  if (input.lb) nodes.push(makeNode('lb', 'lb'))
  for (let i = 0; i < input.appCount; i++) {
    const app = makeNode('app', `app${i}`)
    app.capacity = input.appCapacity
    nodes.push(app)
  }
  if (input.cache) {
    const cache = makeNode('cache', 'cache')
    cache.config.hitRate = input.cacheHitRate
    nodes.push(cache)
  }
  nodes.push(makeNode('db', 'db'))
  const db = nodes[nodes.length - 1]
  db.capacity = input.dbCapacity
  for (let i = 0; i < input.replicas; i++) nodes.push(makeNode('replica', `replica${i}`))
  if (input.queueWorker) {
    nodes.push(makeNode('queue', 'queue'))
    nodes.push(makeNode('worker', 'worker'))
  }
  if (input.search) {
    const es = makeNode('search', 'search')
    if (input.searchCapacity) es.capacity = input.searchCapacity
    nodes.push(es)
  }
  return { nodes, trafficRps: input.trafficRps }
}

export class SimEngine {
  private rt = new Map<string, NodeRuntime>()
  private rng: Rng
  private t = 0
  private spikeMult = 1
  private spikeTicks = 0
  private baseTraffic: number
  history: SimSnapshot[] = []

  constructor(topology: Topology, seed = 42) {
    this.rng = new Rng(seed)
    this.baseTraffic = topology.trafficRps
    for (const n of topology.nodes) {
      this.rt.set(n.id, { node: n, rpsIn: 0, errors: 0, rejected: 0, queueDepth: 0, latencyMs: n.baseLatencyMs, utilization: 0 })
    }
  }

  setTraffic(rps: number): void {
    this.baseTraffic = Math.max(0, rps)
  }

  spike(multiplier: number, durationS: number): void {
    this.spikeMult = multiplier
    this.spikeTicks = Math.round((durationS * 1000) / TICK_MS)
  }

  kill(id: string): void {
    const r = this.rt.get(id)
    if (r && r.node.kind !== 'users') r.node.up = false
  }

  restore(id: string): void {
    const r = this.rt.get(id)
    if (r) r.node.up = true
  }

  setUp(id: string, up: boolean): void {
    const r = this.rt.get(id)
    if (r) r.node.up = up
  }

  node(id: string): SimNode | undefined {
    return this.rt.get(id)?.node
  }

  allNodes(): SimNode[] {
    return [...this.rt.values()].map((r) => r.node)
  }

  step(): SimSnapshot {
    this.t += TICK_MS
    if (this.spikeTicks > 0) {
      this.spikeTicks -= 1
      if (this.spikeTicks === 0) this.spikeMult = 1
    }
    for (const r of this.rt.values()) {
      r.rpsIn = 0
      r.errors = 0
      r.rejected = 0
    }

    const users = this.rt.get('users')
    const lambda = this.baseTraffic * this.spikeMult * (1 + this.rng.range(-0.03, 0.03))
    if (!users) return this.emptySnapshot()

    let flow = lambda
    users.rpsIn = flow

    const cdn = this.rt.get('cdn')
    let cdnLat = 0
    if (cdn) {
      cdn.rpsIn += flow
      this.charge(cdn, flow)
      const hit = cdn.node.up ? cdn.node.config.hitRate ?? 0.72 : 0
      cdnLat = this.latencyOf(cdn)
      flow *= 1 - hit
      if (!cdn.node.up) cdn.errors += lambda
    }

    const rl = this.rt.get('ratelimit')
    let rlLat = 0
    if (rl) {
      rl.rpsIn += flow
      const limit = rl.node.config.limit ?? rl.node.capacity
      const rejected = rl.node.up ? Math.max(0, flow - limit) : flow
      rl.rejected += rejected
      flow -= rejected
      rlLat = this.latencyOf(rl)
      this.charge(rl, flow)
      if (!rl.node.up) rl.errors += lambda
    }

    const lb = this.rt.get('lb')
    let lbLat = 0
    const apps = [...this.rt.values()].filter((r) => r.node.kind === 'app')
    if (lb && apps.length > 0) {
      lb.rpsIn += flow
      lbLat = this.latencyOf(lb)
      this.charge(lb, flow)
      if (!lb.node.up) {
        lb.errors += flow
        flow = 0
      }
    }

    const upApps = apps.filter((a) => a.node.up)
    const totalCap = upApps.reduce((s, a) => s + a.node.capacity, 0)
    let appPathErrors = 0
    let delivered = flow
    if (apps.length > 0 && upApps.length === 0) {
      appPathErrors += delivered
      delivered = 0
    }

    const cache = this.rt.get('cache')
    const db = this.rt.get('db')
    const replicas = [...this.rt.values()].filter((r) => r.node.kind === 'replica' && r.node.up)
    const queue = this.rt.get('queue')
    const worker = this.rt.get('worker')
    const search = this.rt.get('search')

    let dbReads = 0
    let dbWrites = 0
    let searchRps = 0
    let eventRps = 0
    let cacheHits = 0

    for (const app of upApps) {
      const share = totalCap > 0 ? app.node.capacity / totalCap : 0
      const appRps = delivered * share
      app.rpsIn += appRps
      const reads = appRps * (app.node.config.readShare ?? 0.85)
      const writes = appRps * (app.node.config.writeShare ?? 0.15)

      if (cache && cache.node.up) {
        const hits = reads * (cache.node.config.hitRate ?? 0.8)
        cacheHits += hits
        cache.rpsIn += hits
        this.charge(cache, hits)
        dbReads += reads - hits
      } else {
        dbReads += reads
      }

      if (search && search.node.up) {
        const s = appRps * (app.node.config.searchShare ?? 0.12)
        search.rpsIn += s
        this.charge(search, s)
        searchRps += s
      }

      if (queue && worker && queue.node.up && worker.node.up) {
        const ev = writes * (app.node.config.eventShare ?? 0.2)
        eventRps += ev
        queue.rpsIn += ev
      }

      this.charge(app, appRps)
      const appLat = this.latencyOf(app)
      app.latencyMs = appLat
      app.errors += appRps * app.node.errorRate
      if (this.utilizationOf(app) >= 1) {
        const over = appRps * Math.min(1, this.utilizationOf(app) - 1 + 0.2)
        app.errors += over
        appPathErrors += over
      }
    }
    dbWrites = delivered > 0 ? delivered * (apps[0]?.node.config.writeShare ?? 0.15) : 0

    if (db && db.node.up) {
      let primaryReads = dbReads
      if (replicas.length > 0) {
        const replicaCap = replicas.reduce((s, r) => s + r.node.capacity, 0)
        const offload = Math.min(dbReads, Math.min(replicaCap * 0.9, dbReads * 0.75))
        const perR = offload / replicas.length
        for (const r of replicas) {
          r.rpsIn += perR
          this.charge(r, perR)
          r.errors += perR * r.node.errorRate
          r.latencyMs = this.latencyOf(r)
        }
        primaryReads = dbReads - offload
      }
      db.rpsIn += primaryReads + dbWrites
      this.charge(db, primaryReads + dbWrites)
      db.errors += (primaryReads + dbWrites) * db.node.errorRate
      db.latencyMs = this.latencyOf(db)
      if (this.utilizationOf(db) >= 1) {
        const over = (primaryReads + dbWrites) * Math.min(1, this.utilizationOf(db) - 0.8)
        db.errors += over
        appPathErrors += over
      }
    } else if (db) {
      db.errors += dbReads + dbWrites
      appPathErrors += dbReads + dbWrites
    }

    let eventLat = 0
    if (queue && worker) {
      queue.queueDepth = Math.max(0, Math.min(QUEUE_CAP, queue.queueDepth + eventRps * (TICK_MS / 1000) - Math.min(worker.node.up ? worker.node.capacity : 0, queue.queueDepth) * (TICK_MS / 1000)))
      worker.rpsIn = Math.min(worker.node.up ? worker.node.capacity : 0, queue.queueDepth)
      this.charge(worker, worker.rpsIn)
      worker.latencyMs = this.latencyOf(worker)
      const drained = worker.rpsIn * (TICK_MS / 1000)
      queue.queueDepth = Math.max(0, queue.queueDepth - drained)
      queue.latencyMs = queue.queueDepth > 0 ? (queue.queueDepth / Math.max(worker.node.capacity, 1)) * 1000 + queue.node.baseLatencyMs : queue.node.baseLatencyMs
      eventLat = queue.latencyMs + worker.latencyMs
      this.charge(queue, eventRps)
    }

    const searchLat = search && search.node.up ? this.latencyOf(search) : 0

    const mainPath = cdnLat + rlLat + lbLat + (upApps.length > 0 ? upApps[0].latencyMs : 200) + (db ? db.latencyMs : 999)
    const cachePath = cdnLat + rlLat + lbLat + (cache ? cache.latencyMs : 0) + (upApps[0]?.latencyMs ?? 0)
    const hitRate = cache && cache.node.up ? cache.node.config.hitRate ?? 0.8 : 0
    const dbShare = 1 - hitRate
    const mean = mainPath * dbShare + cachePath * hitRate + searchLat * ((searchRps || 0) / Math.max(flow, 1)) + eventLat * ((eventRps || 0) / Math.max(flow, 1)) * 0.3
    const maxRho = Math.max(
      db ? this.utilizationOf(db) : 0,
      upApps.length ? Math.max(...upApps.map((a) => this.utilizationOf(a))) : 0,
    )
    const p50 = Math.max(1, mean * (1 + 0.15 * maxRho) * this.rng.range(0.96, 1.04))
    const p95 = p50 * (1 + 1.4 * Math.min(maxRho, 1.2))

    const totalErrors = appPathErrors + [...this.rt.values()].reduce((s, r) => s + r.errors, 0)
    const totalRejected = [...this.rt.values()].reduce((s, r) => s + r.rejected, 0)
    const errorRate = lambda > 0 ? Math.min(1, totalErrors / lambda) : 0
    const rejectedRate = lambda > 0 ? Math.min(1, totalRejected / lambda) : 0

    const snap: SimSnapshot = {
      t: this.t,
      trafficRps: lambda,
      effectiveRps: lambda * (1 - errorRate - rejectedRate),
      p50,
      p95,
      errorRate,
      rejectedRate,
      nodes: Object.fromEntries([...this.rt.values()].map((r) => [r.node.id, this.metricOf(r)])),
    }
    this.history.push(snap)
    if (this.history.length > HISTORY) this.history.shift()
    return snap
  }

  private charge(r: NodeRuntime, rps: number): void {
    r.utilization = r.node.capacity > 0 && r.node.capacity !== Infinity ? rps / r.node.capacity : 0
  }

  private utilizationOf(r: NodeRuntime): number {
    return r.utilization
  }

  private latencyOf(r: NodeRuntime): number {
    if (!r.node.up) return 5000
    const rho = Math.min(this.utilizationOf(r), 0.999)
    const base = r.node.baseLatencyMs
    if (rho <= 0.001) return base
    return base / (1 - rho)
  }

  private metricOf(r: NodeRuntime): NodeMetric {
    return {
      id: r.node.id,
      rpsIn: r.rpsIn,
      utilization: r.utilization,
      latencyMs: r.latencyMs,
      errors: r.errors,
      rejected: r.rejected,
      queueDepth: r.queueDepth,
      up: r.node.up,
    }
  }

  private emptySnapshot(): SimSnapshot {
    return {
      t: this.t,
      trafficRps: 0,
      effectiveRps: 0,
      p50: 0,
      p95: 0,
      errorRate: 0,
      rejectedRate: 0,
      nodes: {},
    }
  }
}
