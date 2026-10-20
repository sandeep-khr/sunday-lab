import { describe, expect, it } from 'vitest'
import { INCIDENTS } from '../content/incidents'
import { finalScore, incidentGrade, SCORE_CORRECT, SCORE_HARMFUL, SCORE_TIMEOUT } from './incident'
import { useProfile } from './profile'
import { SKILL_DOMAINS, domainMastery, nodeState, overallMastery } from '../content/skilltree'
import { CODEX } from './codex'

describe('incident content integrity', () => {
  it('every action is labeled with a kind and each event has exactly one correct action', () => {
    for (const inc of INCIDENTS) {
      for (const ev of inc.events) {
        const correct = ev.actions.filter((a) => a.kind === 'correct')
        expect(correct.length, `${inc.id}:${ev.title}`).toBe(1)
      }
      expect(inc.retro.options[inc.retro.answer]).toBeDefined()
      for (const c of inc.concepts) expect(CODEX[c], inc.id + c).toBeDefined()
    }
  })
})

describe('incident scoring', () => {
  const inc = INCIDENTS[0]

  it('perfect run: all correct + retro = high score', () => {
    const handled = inc.events.map((_, i) => ({ eventId: i, actionId: 'x', kind: 'correct' as const }))
    const { total } = finalScore(handled, inc.events, true, 0.01)
    expect(total).toBe(inc.events.length * SCORE_CORRECT + 60)
    expect(incidentGrade(total).label).toBe('GOLDEN PAGER')
  })

  it('all timeouts hit the floor and grade as outage', () => {
    const { total } = finalScore([], inc.events, false, 0.5)
    expect(total).toBe(0)
    expect(incidentGrade(total).label).toBe('CAUSED OUTAGE')
  })

  it('harmful calls subtract below wasteful ones', () => {
    expect(SCORE_HARMFUL).toBeLessThan(SCORE_TIMEOUT)
    expect(SCORE_TIMEOUT).toBeLessThan(SCORE_CORRECT)
  })
})

describe('profile & srs', () => {
  it('mastery clamps at 100', () => {
    const s = useProfile.getState()
    s.addMastery('caching', 150)
    expect(useProfile.getState().mastery['caching']).toBe(100)
    useProfile.getState().reset()
  })

  it('lab win recorded once and grants mastery', () => {
    useProfile.getState().reset()
    useProfile.getState().recordLabWin('t2-bots', ['ratelimit'])
    useProfile.getState().recordLabWin('t2-bots', ['ratelimit'])
    const s = useProfile.getState()
    expect(s.labWins.filter((w) => w === 't2-bots').length).toBe(1)
    expect(s.mastery['ratelimit']).toBe(18)
    useProfile.getState().reset()
  })

  it('srs: again reschedules soon; good grows interval', () => {
    useProfile.getState().reset()
    const before = Date.now()
    useProfile.getState().reviewCard('kafka', 'again')
    const again = useProfile.getState().srs['kafka']
    expect(again.due).toBeGreaterThanOrEqual(before + 9 * 60_000)
    expect(again.due).toBeLessThanOrEqual(before + 11 * 60_000)

    useProfile.getState().reviewCard('kafka', 'good')
    const good = useProfile.getState().srs['kafka']
    expect(good.interval).toBeGreaterThan(again.interval)
    useProfile.getState().reset()
  })

  it('dueCards returns new concepts', () => {
    useProfile.getState().reset()
    expect(useProfile.getState().dueCards(['kafka', 'caching'])).toEqual(['kafka', 'caching'])
    useProfile.getState().reviewCard('kafka', 'easy')
    expect(useProfile.getState().dueCards(['kafka', 'caching'])).toEqual(['caching'])
    useProfile.getState().reset()
  })
})

describe('skill tree', () => {
  it('node states progress locked -> learning -> mastered', () => {
    expect(nodeState(undefined)).toBe('locked')
    expect(nodeState(10)).toBe('learning')
    expect(nodeState(80)).toBe('mastered')
  })

  it('domain and overall mastery compute', () => {
    const points: Record<string, number> = {}
    for (const c of SKILL_DOMAINS[0].concepts) points[c] = 100
    expect(domainMastery(points, SKILL_DOMAINS[0])).toBe(100)
    expect(overallMastery(points)).toBeGreaterThan(0)
    expect(overallMastery({})).toBe(0)
  })
})
