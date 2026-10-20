import type { IncidentEvent } from '../content/incidents'

export interface HandledEvent {
  eventId: number
  actionId: string
  kind: 'correct' | 'wasteful' | 'harmful'
}

export const SCORE_CORRECT = 100
export const SCORE_WASTEFUL = 25
export const SCORE_HARMFUL = -60
export const SCORE_TIMEOUT = -30
export const SCORE_RETRO = 60

export function eventScore(kind: 'correct' | 'wasteful' | 'harmful'): number {
  if (kind === 'correct') return SCORE_CORRECT
  if (kind === 'wasteful') return SCORE_WASTEFUL
  return SCORE_HARMFUL
}

export function finalScore(handled: HandledEvent[], events: IncidentEvent[], retroCorrect: boolean, endErrorRate: number): { total: number; breakdown: { label: string; value: string }[] } {
  let total = 0
  let resolved = 0
  let mistakes = 0
  for (const h of handled) {
    total += eventScore(h.kind)
    if (h.kind === 'correct') resolved += 1
    else mistakes += 1
  }
  const missed = events.length - handled.length
  total += missed * SCORE_TIMEOUT
  if (retroCorrect) total += SCORE_RETRO
  total = Math.max(0, total)

  const stability = endErrorRate < 0.1 ? 'STABLE' : endErrorRate < 0.3 ? 'DEGRADED' : 'ON FIRE'
  return {
    total,
    breakdown: [
      { label: 'ALERTS RESOLVED CORRECTLY', value: `${resolved}/${events.length}` },
      { label: 'MISCALLS', value: `${mistakes}` },
      { label: 'UNHANDLED ALERTS', value: `${missed}` },
      { label: 'POSTMORTEM', value: retroCorrect ? 'SOLVED (+60)' : 'MISSED (0)' },
      { label: 'PLATFORM STATE AT CLOSE', value: stability },
    ],
  }
}

export function incidentGrade(total: number): { label: string; tone: string } {
  if (total >= 320) return { label: 'GOLDEN PAGER', tone: '#fbbf24' }
  if (total >= 220) return { label: 'COMMANDER', tone: '#34d399' }
  if (total >= 120) return { label: 'TRAINEE ON-CALL', tone: '#22d3ee' }
  return { label: 'CAUSED OUTAGE', tone: '#fb4d63' }
}
