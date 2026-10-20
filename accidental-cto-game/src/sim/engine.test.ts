import { describe, expect, it } from 'vitest'
import { buildTopology, SimEngine } from './engine'
import { Rng } from './rng'

function run(topo: ReturnType<typeof buildTopology>, seconds: number, seed = 7) {
  const eng = new SimEngine(topo, seed)
  const snaps = []
  for (let i = 0; i < seconds * 10; i++) snaps.push(eng.step())
  return { eng, snaps }
}

describe('sim engine', () => {
  it('is deterministic for the same seed', () => {
    const topo = buildTopology({ cdn: true, ratelimit: true, lb: true, appCount: 3, appCapacity: 2500, cache: true, cacheHitRate: 0.8, replicas: 2, queueWorker: true, search: true, dbCapacity: 4000, trafficRps: 3000 })
    const a = run(topo, 2).snaps.map((s) => s.p95)
    const b = run(topo, 2).snaps.map((s) => s.p95)
    expect(a).toEqual(b)
  })

  it('healthy stack serves traffic with low errors', () => {
    const topo = buildTopology({ cdn: true, ratelimit: true, lb: true, appCount: 3, appCapacity: 2500, cache: true, cacheHitRate: 0.8, replicas: 2, queueWorker: true, search: true, dbCapacity: 4000, trafficRps: 2000 })
    const { snaps } = run(topo, 5)
    const last = snaps[snaps.length - 1]
    expect(last.errorRate).toBeLessThan(0.05)
    expect(last.p95).toBeLessThan(400)
  })

  it('overloaded stack produces errors and high latency', () => {
    const topo = buildTopology({ cdn: false, ratelimit: false, lb: true, appCount: 1, appCapacity: 500, cache: false, cacheHitRate: 0, replicas: 0, queueWorker: false, search: false, dbCapacity: 500, trafficRps: 8000 })
    const { snaps } = run(topo, 5)
    const last = snaps[snaps.length - 1]
    expect(last.errorRate).toBeGreaterThan(0.2)
    expect(last.p95).toBeGreaterThan(500)
  })

  it('cache hit rate reduces database load', () => {
    const base = { cdn: false, ratelimit: false, lb: true, appCount: 2, appCapacity: 2500, replicas: 0, queueWorker: false, search: false, dbCapacity: 4000, trafficRps: 3000 }
    const noCache = run(buildTopology({ ...base, cache: false, cacheHitRate: 0 }), 4).snaps.at(-1)!
    const withCache = run(buildTopology({ ...base, cache: true, cacheHitRate: 0.9 }), 4).snaps.at(-1)!
    expect(withCache.nodes['db'].rpsIn).toBeLessThan(noCache.nodes['db'].rpsIn * 0.5)
  })

  killingNodeTest()

  it('replicas offload reads from primary', () => {
    const base = { cdn: false, ratelimit: false, lb: true, appCount: 2, appCapacity: 2500, cache: true, cacheHitRate: 0.5, queueWorker: false, search: false, dbCapacity: 4000, trafficRps: 3000 }
    const solo = run(buildTopology({ ...base, replicas: 0 }), 4).snaps.at(-1)!
    const withReplicas = run(buildTopology({ ...base, replicas: 2 }), 4).snaps.at(-1)!
    expect(withReplicas.nodes['db'].utilization).toBeLessThan(solo.nodes['db'].utilization)
  })

  it('spike multiplier raises traffic then decays back', () => {
    const topo = buildTopology({ cdn: true, ratelimit: false, lb: true, appCount: 2, appCapacity: 2500, cache: true, cacheHitRate: 0.8, replicas: 1, queueWorker: false, search: false, dbCapacity: 4000, trafficRps: 1000 })
    const eng = new SimEngine(topo, 3)
    eng.spike(10, 1)
    const during = eng.step()
    for (let i = 0; i < 20; i++) eng.step()
    const after = eng.step()
    expect(during.trafficRps).toBeGreaterThan(5000)
    expect(after.trafficRps).toBeLessThan(2000)
  })
})

function killingNodeTest() {
  it('killing the only app server fails all traffic; killing one of many degrades gracefully', () => {
    const single = buildTopology({ cdn: false, ratelimit: false, lb: true, appCount: 1, appCapacity: 2500, cache: false, cacheHitRate: 0, replicas: 0, queueWorker: false, search: false, dbCapacity: 4000, trafficRps: 1000 })
    const eng1 = new SimEngine(single, 5)
    eng1.kill('app0')
    eng1.step()
    const s1 = eng1.step()
    expect(s1.errorRate).toBeGreaterThan(0.5)

    const multi = buildTopology({ cdn: false, ratelimit: false, lb: true, appCount: 3, appCapacity: 2500, cache: false, cacheHitRate: 0, replicas: 0, queueWorker: false, search: false, dbCapacity: 4000, trafficRps: 1000 })
    const eng2 = new SimEngine(multi, 5)
    eng2.kill('app0')
    eng2.step()
    const s2 = eng2.step()
    expect(s2.errorRate).toBeLessThan(0.2)
  })
}

describe('rng', () => {
  it('same seed same sequence', () => {
    const a = new Rng(123)
    const b = new Rng(123)
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()])
  })
})
