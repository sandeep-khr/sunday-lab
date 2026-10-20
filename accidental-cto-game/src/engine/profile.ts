import { create } from 'zustand'

const KEY = 'actg-profile-v1'

export interface SrsCard {
  due: number
  interval: number
  ease: number
  reps: number
}

export interface ProfileState {
  mastery: Record<string, number>
  labWins: string[]
  arenaBest: Record<string, number>
  srs: Record<string, SrsCard>
  incidentsCleared: string[]
  addMastery: (conceptId: string, points: number) => void
  recordLabWin: (scenarioId: string, concepts: string[]) => void
  recordArena: (promptId: string, score: number, concepts: string[]) => void
  recordIncident: (id: string, concepts: string[]) => void
  reviewCard: (conceptId: string, grade: 'again' | 'hard' | 'good' | 'easy') => void
  dueCards: (allConceptIds: string[]) => string[]
  reset: () => void
}

function load(): Pick<ProfileState, 'mastery' | 'labWins' | 'arenaBest' | 'srs' | 'incidentsCleared'> {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return { mastery: {}, labWins: [], arenaBest: {}, srs: {}, incidentsCleared: [] }
}

function persist(s: ProfileState): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ mastery: s.mastery, labWins: s.labWins, arenaBest: s.arenaBest, srs: s.srs, incidentsCleared: s.incidentsCleared }),
    )
  } catch {
    /* ignore */
  }
}

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

export const useProfile = create<ProfileState>((set, get) => ({
  ...load(),

  addMastery: (conceptId, points) => {
    const m = { ...get().mastery }
    m[conceptId] = Math.min(100, (m[conceptId] ?? 0) + points)
    set({ mastery: m })
    persist(get())
  },

  recordLabWin: (scenarioId, concepts) => {
    const s = get()
    if (s.labWins.includes(scenarioId)) return
    const m = { ...s.mastery }
    for (const c of concepts) m[c] = Math.min(100, (m[c] ?? 0) + 18)
    set({ labWins: [...s.labWins, scenarioId], mastery: m })
    persist(get())
  },

  recordArena: (promptId, score, concepts) => {
    const s = get()
    const best = Math.max(s.arenaBest[promptId] ?? 0, score)
    const m = { ...s.mastery }
    if (score >= 70) for (const c of concepts) m[c] = Math.min(100, (m[c] ?? 0) + 15)
    set({ arenaBest: { ...s.arenaBest, promptId: best }, mastery: m })
    persist(get())
  },

  recordIncident: (id, concepts) => {
    const s = get()
    if (s.incidentsCleared.includes(id)) return
    const m = { ...s.mastery }
    for (const c of concepts) m[c] = Math.min(100, (m[c] ?? 0) + 20)
    set({ incidentsCleared: [...s.incidentsCleared, id], mastery: m })
    persist(get())
  },

  reviewCard: (conceptId, grade) => {
    const s = get()
    const now = Date.now()
    const prev: SrsCard = s.srs[conceptId] ?? { due: now, interval: 0, ease: 2.5, reps: 0 }
    let { interval, ease } = prev
    if (grade === 'again') {
      interval = 10 * MINUTE
      ease = Math.max(1.3, ease - 0.2)
    } else {
      ease = Math.min(2.8, ease + (grade === 'easy' ? 0.1 : grade === 'good' ? 0 : -0.05))
      interval = prev.reps === 0 ? (grade === 'hard' ? 0.5 * DAY : 1 * DAY) : Math.max(0.5 * DAY, interval * (grade === 'hard' ? 1.2 : grade === 'easy' ? ease + 0.3 : ease))
    }
    const card: SrsCard = { due: now + interval, interval, ease, reps: prev.reps + 1 }
    const srs = { ...s.srs, [conceptId]: card }
    const m = { ...s.mastery }
    if (grade !== 'again') m[conceptId] = Math.min(100, (m[conceptId] ?? 0) + (grade === 'easy' ? 4 : 2))
    set({ srs, mastery: m })
    persist(get())
  },

  dueCards: (allConceptIds) => {
    const now = Date.now()
    const s = get()
    return allConceptIds.filter((id) => {
      const card = s.srs[id]
      return !card || card.due <= now
    })
  },

  reset: () => {
    set({ mastery: {}, labWins: [], arenaBest: {}, srs: {}, incidentsCleared: [] })
    persist(get())
  },
}))
