export type NodeKind =
  | 'users'
  | 'cdn'
  | 'ratelimit'
  | 'lb'
  | 'app'
  | 'cache'
  | 'db'
  | 'replica'
  | 'queue'
  | 'worker'
  | 'search'

export interface SimNode {
  id: string
  kind: NodeKind
  label: string
  capacity: number
  baseLatencyMs: number
  errorRate: number
  up: boolean
  config: Partial<NodeConfig>
}

export interface NodeConfig {
  hitRate: number
  readShare: number
  writeShare: number
  eventShare: number
  searchShare: number
  limit: number
}

export interface Topology {
  nodes: SimNode[]
  trafficRps: number
}

export interface NodeMetric {
  id: string
  rpsIn: number
  utilization: number
  latencyMs: number
  errors: number
  rejected: number
  queueDepth: number
  up: boolean
}

export interface SimSnapshot {
  t: number
  trafficRps: number
  effectiveRps: number
  p50: number
  p95: number
  errorRate: number
  rejectedRate: number
  nodes: Record<string, NodeMetric>
}

export interface ScenarioDef {
  id: string
  name: string
  brief: string
  traffic: (t: number) => number
  win: (s: SimSnapshot, history: SimSnapshot[]) => boolean
  fail?: (s: SimSnapshot, history: SimSnapshot[]) => boolean
  durationS: number
}
