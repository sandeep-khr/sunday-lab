import type { NodeConfig, NodeKind, SimNode } from './types'

export const DEFAULT_CONFIG: NodeConfig = {
  hitRate: 0.7,
  readShare: 0.85,
  writeShare: 0.15,
  eventShare: 0.2,
  searchShare: 0.12,
  limit: 5000,
}

interface Spec {
  label: string
  capacity: number
  baseLatencyMs: number
  errorRate: number
  config?: Partial<NodeConfig>
}

export const CATALOG: Record<NodeKind, Spec> = {
  users: { label: 'MERCHANTS', capacity: Infinity, baseLatencyMs: 0, errorRate: 0 },
  cdn: { label: 'CDN EDGE', capacity: 200000, baseLatencyMs: 12, errorRate: 0.001, config: { hitRate: 0.72 } },
  ratelimit: { label: 'RATE LIMITER', capacity: 120000, baseLatencyMs: 1, errorRate: 0.0005 },
  lb: { label: 'LOAD BALANCER', capacity: 80000, baseLatencyMs: 2, errorRate: 0.0005 },
  app: { label: 'APP SERVER', capacity: 2500, baseLatencyMs: 24, errorRate: 0.004 },
  cache: { label: 'REDIS', capacity: 90000, baseLatencyMs: 1.5, errorRate: 0.001, config: { hitRate: 0.8 } },
  db: { label: 'POSTGRES', capacity: 4000, baseLatencyMs: 18, errorRate: 0.003 },
  replica: { label: 'REPLICA', capacity: 3200, baseLatencyMs: 16, errorRate: 0.003 },
  queue: { label: 'KAFKA', capacity: 50000, baseLatencyMs: 4, errorRate: 0.001 },
  worker: { label: 'WORKER', capacity: 3000, baseLatencyMs: 30, errorRate: 0.004 },
  search: { label: 'ELASTICSEARCH', capacity: 6000, baseLatencyMs: 10, errorRate: 0.004 },
}

let counter = 0
export function makeNode(kind: NodeKind, id?: string): SimNode {
  const spec = CATALOG[kind]
  counter += 1
  return {
    id: id ?? `${kind}-${counter}`,
    kind,
    label: spec.label,
    capacity: spec.capacity,
    baseLatencyMs: spec.baseLatencyMs,
    errorRate: spec.errorRate,
    up: true,
    config: { ...DEFAULT_CONFIG, ...spec.config },
  }
}
