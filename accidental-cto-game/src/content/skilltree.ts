export interface SkillDomain {
  id: string
  name: string
  concepts: string[]
}

export const SKILL_DOMAINS: SkillDomain[] = [
  { id: 'foundations', name: 'FOUNDATIONS', concepts: ['monitoring', 'mvp', 'db_split'] },
  { id: 'traffic', name: 'TRAFFIC & SCALE', concepts: ['scaling', 'lb', 'ratelimit'] },
  { id: 'data', name: 'DATA SYSTEMS', concepts: ['replicas', 'sharding', 'nosql', 'kafka'] },
  { id: 'performance', name: 'PERFORMANCE', concepts: ['caching', 'cache_patterns', 'search'] },
  { id: 'delivery', name: 'DELIVERY', concepts: ['staging', 'cicd', 'strangler'] },
  { id: 'infrastructure', name: 'INFRASTRUCTURE', concepts: ['docker', 'k8s', 'edge', 'cloud_econ'] },
  { id: 'operations', name: 'OPERATIONS', concepts: ['chaos', 'postmortem', 'estimation'] },
  { id: 'leadership', name: 'LEADERSHIP', concepts: ['sla', 'brand', 'realtime'] },
]

export function nodeState(points: number | undefined): 'locked' | 'learning' | 'mastered' {
  const p = points ?? 0
  if (p >= 80) return 'mastered'
  if (p > 0) return 'learning'
  return 'locked'
}

export function domainMastery(points: Record<string, number>, domain: SkillDomain): number {
  const total = domain.concepts.reduce((s, c) => s + (points[c] ?? 0), 0)
  return Math.round(total / domain.concepts.length)
}

export function overallMastery(points: Record<string, number>): number {
  const all = SKILL_DOMAINS.flatMap((d) => d.concepts)
  return Math.round(all.reduce((s, c) => s + (points[c] ?? 0), 0) / all.length)
}
