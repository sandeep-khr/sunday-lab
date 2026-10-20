export interface ClarifyOption {
  id: string
  text: string
  good: boolean
  feedback: string
}

export interface Mcq {
  q: string
  options: [string, string, string]
  answer: 0 | 1 | 2
  explain: string
}

export interface DesignComponent {
  id: string
  label: string
}

export interface DesignSpec {
  required: string[]
  bonus: string[]
  forbidden: { id: string; why: string }[]
}

export interface ArenaPrompt {
  id: string
  title: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  persona: string
  ask: string
  clarify: { prompt: string; picks: number; options: ClarifyOption[] }
  estimate: Mcq[]
  design: { prompt: string } & DesignSpec
  defend: Mcq[]
}

export const COMPONENTS: DesignComponent[] = [
  { id: 'cdn', label: 'CDN' },
  { id: 'lb', label: 'LOAD BALANCER' },
  { id: 'app', label: 'APP SERVERS' },
  { id: 'cache', label: 'REDIS CACHE' },
  { id: 'sql', label: 'SQL DATABASE' },
  { id: 'nosql', label: 'DOCUMENT STORE' },
  { id: 'sharding', label: 'SHARDING' },
  { id: 'replicas', label: 'READ REPLICAS' },
  { id: 'queue', label: 'KAFKA QUEUE' },
  { id: 'worker', label: 'WORKERS' },
  { id: 'es', label: 'ELASTICSEARCH' },
  { id: 'ratelimit', label: 'RATE LIMITER' },
  { id: 'ws', label: 'WEBSOCKETS' },
  { id: 'blob', label: 'BLOB STORAGE' },
]

export const MAX = { clarify: 30, estimate: 30, design: 25, defend: 15 }

export function scoreClarify(prompt: ArenaPrompt, picked: string[]): { points: number; notes: { text: string; good: boolean }[] } {
  const per = MAX.clarify / prompt.clarify.picks
  const notes: { text: string; good: boolean }[] = []
  let points = 0
  for (const id of picked) {
    const opt = prompt.clarify.options.find((o) => o.id === id)
    if (!opt) continue
    if (opt.good) {
      points += per
      notes.push({ text: opt.feedback, good: true })
    } else {
      notes.push({ text: opt.feedback, good: false })
    }
  }
  if (picked.length < prompt.clarify.picks) {
    notes.push({ text: `You asked ${picked.length} of ${prompt.clarify.picks} questions — interviewers read caution as competence.`, good: false })
  }
  return { points: Math.round(points), notes }
}

export function scoreMcqList(list: Mcq[], answers: (number | null)[]): { correct: number; total: number; points: number; notes: { q: string; correct: boolean; explain: string }[] } {
  const notes = list.map((m, i) => ({
    q: m.q,
    correct: answers[i] === m.answer,
    explain: m.explain,
  }))
  const correct = notes.filter((n) => n.correct).length
  return { correct, total: list.length, points: correct / list.length, notes }
}

export function scoreDesign(prompt: ArenaPrompt, picked: string[]): { points: number; notes: { text: string; good: boolean }[] } {
  const notes: { text: string; good: boolean }[] = []
  let points = 0
  const per = MAX.design / prompt.design.required.length
  for (const req of prompt.design.required) {
    if (picked.includes(req)) {
      points += per
    } else {
      const label = COMPONENTS.find((c) => c.id === req)?.label ?? req
      notes.push({ text: `Missing: ${label} — an interviewer would probe this gap.`, good: false })
    }
  }
  for (const b of prompt.design.bonus) {
    if (picked.includes(b)) points += 1
  }
  for (const f of prompt.design.forbidden) {
    if (picked.includes(f.id)) {
      points -= 8
      const label = COMPONENTS.find((c) => c.id === f.id)?.label ?? f.id
      notes.push({ text: `Over-engineering: ${label}. ${f.why}`, good: false })
    }
  }
  return { points: Math.max(0, Math.round(points)), notes }
}

export function totalScore(parts: { clarify: number; estimate: number; design: number; defend: number }): number {
  const raw = parts.clarify + parts.estimate * MAX.estimate + parts.design + parts.defend * MAX.defend
  return Math.round(raw)
}

export function grade(total: number): { label: string; tone: string; text: string } {
  if (total >= 85)
    return { label: 'STRONG HIRE', tone: '#34d399', text: 'You clarified, estimated, designed and defended like a senior candidate. This is a loop-winning performance.' }
  if (total >= 70)
    return { label: 'HIRE', tone: '#22d3ee', text: 'Solid system design instincts with a few gaps. Review the feedback and run it again — you are close.' }
  if (total >= 55)
    return { label: 'LEAN HIRE', tone: '#fbbf24', text: 'The skeleton is there but estimations and trade-offs need work. Drill the Estimation Gym, then retry.' }
  return { label: 'NO HIRE', tone: '#fb4d63', text: 'The panel had concerns. Study the feedback per phase, replay the campaign chapters, and come back stronger.' }
}
