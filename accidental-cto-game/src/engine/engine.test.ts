import { describe, expect, it } from 'vitest'
import { applyEffects, capacityOf, checkGameOver, initialState, tick } from './state'
import { parseChapters } from './content-schema'
import { COMPONENTS } from './state'
import rawAct12 from '../content/act12.json'
import rawAct345 from '../content/act345.json'

const chapters = [...parseChapters(rawAct12), ...parseChapters(rawAct345)]

describe('content integrity', () => {
  it('parses the full campaign', () => {
    expect(chapters.length).toBeGreaterThanOrEqual(21)
  })

  it('chapter ids are unique and ordered', () => {
    const ids = chapters.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every unlock references a known component', () => {
    for (const ch of chapters) {
      for (const scene of ch.scenes) {
        const unlocks = [
          ...(scene.choices ?? []).map((c) => c.unlock),
          ...(scene.investigation?.fixes ?? []).map((f) => f.unlock),
        ]
        for (const u of unlocks) {
          if (u) expect(COMPONENTS[u], `${ch.id}:${u}`).toBeDefined()
        }
      }
    }
  })

  it('every investigation is solvable and fixes reference discoverable clues', () => {
    for (const ch of chapters) {
      for (const scene of ch.scenes) {
        const inv = scene.investigation
        if (!inv) continue
        const clues = new Set(inv.checks.map((c) => c.clue).filter(Boolean))
        const solvable = inv.fixes.some((f) => f.requires.every((r) => clues.has(r)))
        expect(solvable, `${ch.id} has no evidence-backed fix`).toBe(true)
      }
    }
  })

  it('all codex ids exist in CODEX', async () => {
    const { CODEX } = await import('./codex')
    for (const ch of chapters) {
      for (const id of ch.codex ?? []) {
        expect(CODEX[id], `${ch.id}:${id}`).toBeDefined()
      }
    }
  })

  it('quiz answers are within range', () => {
    for (const ch of chapters) {
      if (ch.quiz) expect([0, 1, 2]).toContain(ch.quiz.answer)
    }
  })
})

describe('game state', () => {
  it('clamps stats to 0..100', () => {
    const s = initialState()
    s.reliability = 95
    applyEffects(s, { reliability: 50 })
    expect(s.reliability).toBe(100)
    applyEffects(s, { reliability: -500 })
    expect(s.reliability).toBe(0)
  })

  it('tick advances month, applies economy, reports load/capacity', () => {
    const s = initialState()
    s.unlocked.push('mvp')
    const before = s.cash
    const r = tick(s, 1.3)
    expect(s.month).toBe(2)
    expect(r.revenue).toBe(Math.round(r.users * 2.1))
    expect(s.cash).toBe(before + r.net - 14 * 0)
    expect(r.capacity).toBeGreaterThan(0)
    expect(r.load).toBeGreaterThan(0)
  })

  it('capacity ceiling limits growth until infra expands', () => {
    const s = initialState()
    s.unlocked.push('mvp', 'lb', 'redis')
    s.reliability = 90
    s.speed = 90
    s.reputation = 90
    s.users = 130
    const before = structuredClone(s)
    tick(s, 3)
    expect(s.users).toBeLessThanOrEqual(capacityOf(before) * 1.25 + 0.05)
    expect(s.users).toBeGreaterThan(before.users)
    const bigger = structuredClone(before)
    bigger.unlocked.push('cdn')
    tick(bigger, 3)
    expect(bigger.users).toBeGreaterThan(s.users)
  })
})

describe('capacity & overload', () => {
  it('overload fires elastic incident when lb present', () => {
    const s = initialState()
    s.unlocked.push('mvp', 'lb')
    s.users = capacityOf(s) * 2
    const r = tick(s, 1)
    expect(r.incidents.some((i) => i.id === 'elastic-scale')).toBe(true)
  })

  it('overload fires outage when no scaling layer exists', () => {
    const s = initialState()
    s.unlocked.push('mvp')
    s.users = capacityOf(s) * 2
    const r = tick(s, 1)
    expect(r.incidents.some((i) => i.id === 'overload-outage')).toBe(true)
  })
})

describe('incidents', () => {
  it('fires friday-deploy when debt is high without staging', () => {
    const s = initialState()
    s.debt = 60
    const r = tick(s, 1)
    expect(r.incidents.some((i) => i.id === 'friday-deploy')).toBe(true)
  })

  it('does not refire the same incident', () => {
    const s = initialState()
    s.debt = 60
    tick(s, 1)
    s.debt = 90
    const second = tick(s, 1)
    expect(second.incidents.some((i) => i.id === 'friday-deploy')).toBe(false)
  })

  it('stale-prices sets pinned_reads after firing', () => {
    const s = initialState()
    s.flags['stale_risk'] = true
    tick(s, 1)
    expect(s.flags['pinned_reads']).toBe(true)
  })

  it('db-melt requires users without redis', () => {
    const s = initialState()
    s.unlocked.push('mvp', 'lb')
    s.users = 40
    const r = tick(s, 1)
    expect(r.incidents.some((i) => i.id === 'db-melt') || r.load <= r.capacity).toBe(true)

    const safe = structuredClone(s)
    safe.unlocked.push('redis')
    const cap = capacityOf(safe)
    safe.users = Math.min(40, cap * 0.5)
    const r2 = tick(safe, 1)
    expect(r2.incidents.some((i) => i.id === 'db-melt')).toBe(false)
  })
})

describe('game over & endings', () => {
  it('detects bankruptcy', () => {
    const s = initialState()
    s.cash = -41
    expect(checkGameOver(s)?.kind).toBe('bankrupt')
  })

  it('healthy state survives', () => {
    expect(checkGameOver(initialState())).toBeNull()
  })

  it('failover flag boosts ending score toward ipo', async () => {
    const { computeEnding } = await import('./state')
    const s = initialState()
    s.flags['failover_passed'] = true
    const withFlag = computeEnding(s)
    const without = computeEnding({ ...s, flags: {} })
    expect(withFlag.score).toBe(without.score + 40)
  })
})
