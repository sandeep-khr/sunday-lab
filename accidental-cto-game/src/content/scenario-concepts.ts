import { CODEX } from '../engine/codex'

export const SCENARIO_CONCEPTS: Record<string, string[]> = {
  't1-first': ['scaling', 'db_split'],
  't2-divorce': ['db_split', 'caching', 'replicas'],
  't2-stampede': ['caching', 'replicas', 'cache_patterns'],
  't2-bots': ['ratelimit'],
  't3-writes': ['kafka', 'strangler'],
  't3-search': ['search'],
  't4-killprimary': ['replicas', 'chaos'],
  't4-blackfriday': ['ratelimit', 'caching', 'scaling'],
  't5-halfmillion': ['scaling', 'sharding', 'estimation'],
  't5-meltdown': ['chaos', 'postmortem'],
}

export function conceptsForScenario(id: string): string[] {
  return (SCENARIO_CONCEPTS[id] ?? []).filter((c) => CODEX[c])
}
