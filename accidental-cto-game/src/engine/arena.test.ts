import { describe, expect, it } from 'vitest'
import { ARENA_PROMPTS } from '../content/arena-prompts'
import { COMPONENTS, grade, scoreClarify, scoreDesign, scoreMcqList, totalScore } from './arena'

describe('arena content integrity', () => {
  it('has prompts with all phases populated', () => {
    expect(ARENA_PROMPTS.length).toBeGreaterThanOrEqual(4)
    for (const p of ARENA_PROMPTS) {
      expect(p.clarify.options.length).toBeGreaterThanOrEqual(p.clarify.picks)
      expect(p.clarify.options.filter((o) => o.good).length).toBeGreaterThanOrEqual(p.clarify.picks)
      expect(p.estimate.length).toBeGreaterThanOrEqual(3)
      expect(p.defend.length).toBeGreaterThanOrEqual(3)
      expect(p.design.required.length).toBeGreaterThan(0)
    }
  })

  it('design component ids exist in palette', () => {
    const ids = new Set(COMPONENTS.map((c) => c.id))
    for (const p of ARENA_PROMPTS) {
      for (const r of p.design.required) expect(ids.has(r), p.id + r).toBe(true)
      for (const b of p.design.bonus) expect(ids.has(b), p.id + b).toBe(true)
      for (const f of p.design.forbidden) expect(ids.has(f.id), p.id + f.id).toBe(true)
    }
  })

  it('required sets are achievable (no required item also forbidden)', () => {
    for (const p of ARENA_PROMPTS) {
      const forbidden = new Set(p.design.forbidden.map((f) => f.id))
      for (const r of p.design.required) expect(forbidden.has(r), p.id + r).toBe(false)
    }
  })
})

describe('arena scoring', () => {
  const p = ARENA_PROMPTS[0]

  it('perfect clarify picks score full marks', () => {
    const goods = p.clarify.options.filter((o) => o.good).slice(0, p.clarify.picks).map((o) => o.id)
    expect(scoreClarify(p, goods).points).toBe(30)
  })

  it('bad clarify picks score zero', () => {
    const bads = p.clarify.options.filter((o) => !o.good).slice(0, p.clarify.picks).map((o) => o.id)
    expect(scoreClarify(p, bads).points).toBe(0)
  })

  it('perfect run totals 100 and grades STRONG HIRE', () => {
    const goods = p.clarify.options.filter((o) => o.good).slice(0, p.clarify.picks).map((o) => o.id)
    const est = scoreMcqList(p.estimate, p.estimate.map((m) => m.answer))
    const design = scoreDesign(p, [...p.design.required, ...p.design.bonus])
    const def = scoreMcqList(p.defend, p.defend.map((m) => m.answer))
    const total = totalScore({ clarify: goods.length ? scoreClarify(p, goods).points : 0, estimate: est.points, design: design.points, defend: def.points })
    expect(total).toBeGreaterThanOrEqual(100)
    expect(grade(total).label).toBe('STRONG HIRE')
  })

  it('zero run grades NO HIRE', () => {
    expect(grade(totalScore({ clarify: 0, estimate: 0, design: 0, defend: 0 })).label).toBe('NO HIRE')
  })
})
