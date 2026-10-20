import { create } from 'zustand'
import { parseChapters } from './content-schema'
import act12 from '../content/act12.json'
import act345 from '../content/act345.json'
import act6 from '../content/act6.json'
import {
  applyEffects,
  checkGameOver,
  computeEnding,
  initialState,
  tick,
  type GameState,
  type GameOverReason,
  type TickReport,
} from './state'
import { useProfile } from './profile'
import type { Chapter, Choice, Effects, Quiz } from './types'

export const CHAPTERS: Chapter[] = [
  ...parseChapters(act12),
  ...parseChapters(act345),
  ...parseChapters(act6),
].sort((a, b) => a.act - b.act || Number(a.num) - Number(b.num))

export type Phase = 'title' | 'intro' | 'scene' | 'result' | 'quiz' | 'report' | 'gameover' | 'ending'

const SAVE_KEY = 'actg-save-v2'

interface SaveData {
  game: GameState
  codexUnlocked: string[]
}

function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SaveData
    if (!data.game || !Array.isArray(data.game.unlocked)) return null
    return data
  } catch {
    return null
  }
}

function persist(game: GameState, codexUnlocked: string[]): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ game, codexUnlocked } satisfies SaveData))
  } catch {
    /* storage full or unavailable */
  }
}

interface Store {
  phase: Phase
  hasSave: boolean
  game: GameState
  codexUnlocked: string[]
  previewUnlock: string | null
  conceptOpen: string | null
  invDiscovered: string[]
  invTried: Record<string, true>
  invLog: string[]
  lastChoice: Choice | null
  lastEffects: Effects | null
  lastUnlock: string | null
  lastQuiz: Quiz | null
  quizFeedback: { correct: boolean; explain: string } | null
  lastReport: TickReport | null
  gameOver: GameOverReason | null
  ending: ReturnType<typeof computeEnding> | null
  chapter: () => Chapter
  scene: () => import('./types').Scene | undefined
  newRun: () => void
  continueRun: () => void
  beginChapter: () => void
  choose: (index: number) => void
  hoverUnlock: (id: string | null) => void
  openConcept: (id: string | null) => void
  runCheck: (checkId: string) => void
  attemptFix: (fixId: string) => void
  continueResult: () => void
  answerQuiz: (index: number) => void
  proceedFromQuiz: () => void
  proceedFromReport: () => void
}

function clone(s: GameState): GameState {
  return structuredClone(s)
}

export const useGame = create<Store>((set, get) => ({
  phase: 'title',
  hasSave: typeof window !== 'undefined' && !!loadSave(),
  game: initialState(),
  codexUnlocked: [],
  previewUnlock: null,
  conceptOpen: null,
  invDiscovered: [],
  invTried: {},
  invLog: [],
  lastChoice: null,
  lastEffects: null,
  lastUnlock: null,
  lastQuiz: null,
  quizFeedback: null,
  lastReport: null,
  gameOver: null,
  ending: null,

  chapter: () => CHAPTERS[get().game.chapterIndex],

  scene: () => {
    const { game, chapter } = get()
    return chapter().scenes[game.sceneIndex]
  },

  newRun: () => {
    set({
      phase: 'intro',
      game: initialState(),
      codexUnlocked: [],
      previewUnlock: null,
      lastChoice: null,
      lastEffects: null,
      lastUnlock: null,
      lastQuiz: null,
      quizFeedback: null,
      lastReport: null,
      gameOver: null,
      ending: null,
    })
    persist(initialState(), [])
  },

  continueRun: () => {
    const save = loadSave()
    if (!save) return
    set({ phase: 'intro', game: save.game, codexUnlocked: save.codexUnlocked })
  },

  beginChapter: () => set({ phase: 'scene', invDiscovered: [], invTried: {}, invLog: [] }),

  choose: (index) => {
    const { game, chapter } = get()
    const sc = chapter().scenes[game.sceneIndex]
    const choice = sc.choices?.[index]
    if (!choice) return
    const next = clone(game)
    applyEffects(next, choice.effects)
    if (choice.unlock && !next.unlocked.includes(choice.unlock)) next.unlocked.push(choice.unlock)
    if (choice.setFlags) for (const f of choice.setFlags) next.flags[f] = true
    set({ game: next, phase: 'result', lastChoice: choice, lastEffects: choice.effects, lastUnlock: choice.unlock ?? null })
    persist(next, get().codexUnlocked)
  },

  hoverUnlock: (id) => set({ previewUnlock: id }),

  openConcept: (id) => set({ conceptOpen: id }),

  runCheck: (checkId) => {
    const scene = get().scene()
    const inv = scene?.investigation
    if (!inv) return
    const check = inv.checks.find((c) => c.id === checkId)
    if (!check) return
    const log = [...get().invLog, `$ ${check.label}`, ...check.out.split('\n'), '']
    const discovered = [...get().invDiscovered]
    if (check.clue && !discovered.includes(check.clue)) {
      discovered.push(check.clue)
      log.push('>> EVIDENCE LOGGED — add it to your diagnosis', '')
    }
    set({ invLog: log, invDiscovered: discovered })
  },

  attemptFix: (fixId) => {
    const state = get()
    const inv = state.scene()?.investigation
    if (!inv) return
    const fix = inv.fixes.find((f) => f.id === fixId)
    if (!fix || state.invTried[fixId]) return

    const missing = fix.requires.filter((r) => !state.invDiscovered.includes(r))
    if (missing.length > 0) {
      const next = clone(state.game)
      if (fix.failEffects) applyEffects(next, fix.failEffects)
      const failLine = fix.failText ?? 'You acted without the full picture — the team pulls you back before damage spreads.'
      set({
        game: next,
        invTried: { ...state.invTried, [fixId]: true },
        invLog: [...state.invLog, `$ ${fix.label}`, '!! FAILED', `   ${failLine}`, ''],
      })
      persist(next, state.codexUnlocked)
      return
    }

    const next = clone(state.game)
    applyEffects(next, fix.effects)
    if (fix.unlock && !next.unlocked.includes(fix.unlock)) next.unlocked.push(fix.unlock)
    set({
      game: next,
      phase: 'result',
      lastChoice: {
        id: fix.id,
        label: fix.label,
        detail: '',
        effects: fix.effects,
        unlock: fix.unlock,
        deepDive: fix.deepDive,
        result: fix.successText,
        lesson: fix.lesson,
      },
      lastEffects: fix.effects,
      lastUnlock: fix.unlock ?? null,
      invLog: [...state.invLog, `$ ${fix.label}`, '>> FIX DEPLOYED — incident resolved.', ''],
    })
    persist(next, state.codexUnlocked)
  },

  continueResult: () => {
    const state = get()
    const ch = state.chapter()
    const codex = new Set(state.codexUnlocked)
    const nextSceneIndex = state.game.sceneIndex + 1
    if (nextSceneIndex < ch.scenes.length) {
      const next = clone(state.game)
      next.sceneIndex = nextSceneIndex
      set({
        game: next,
        phase: 'scene',
        lastChoice: null,
        lastEffects: null,
        lastUnlock: null,
        codexUnlocked: [...codex],
        invDiscovered: [],
        invTried: {},
        invLog: [],
      })
      return
    }
    if (ch.quiz && !state.game.flags[`quiz_${ch.id}`]) {
      set({ phase: 'quiz', lastQuiz: ch.quiz, quizFeedback: null, codexUnlocked: [...codex] })
      return
    }
    runTick(set, get, [...codex])
  },

  answerQuiz: (index) => {
    const { lastQuiz } = get()
    if (!lastQuiz) return
    set({ quizFeedback: { correct: index === lastQuiz.answer, explain: lastQuiz.explain } })
  },

  proceedFromQuiz: () => {
    const state = get()
    const ch = state.chapter()
    const next = clone(state.game)
    next.flags[`quiz_${ch.id}`] = true
    if (state.quizFeedback?.correct) {
      next.morale = Math.min(100, next.morale + 2)
      for (const c of ch.codex ?? []) useProfile.getState().addMastery(c, 10)
    }
    set({ game: next })
    runTick(set, get, state.codexUnlocked)
  },

  proceedFromReport: () => {
    const state = get()
    const over = checkGameOver(state.game)
    if (over) {
      set({ phase: 'gameover', gameOver: over })
      return
    }
    const nextIndex = state.game.chapterIndex + 1
    if (nextIndex >= CHAPTERS.length) {
      set({ phase: 'ending', ending: computeEnding(state.game) })
      return
    }
    const next = clone(state.game)
    next.chapterIndex = nextIndex
    next.sceneIndex = 0
    set({ game: next, phase: 'intro', lastChoice: null, lastEffects: null, lastUnlock: null, lastReport: null })
  },
}))

type SetFn = (partial: Partial<Store>) => void
type GetFn = () => Store

function runTick(set: SetFn, get: GetFn, codexUnlocked: string[]) {
  const state = get()
  const after = clone(state.game)
  const ch = state.chapter()
  const report = tick(after, ch.surge)
  const codex = new Set(codexUnlocked)
  for (const id of ch.codex ?? []) codex.add(id)
  set({ game: after, lastReport: report, phase: 'report', codexUnlocked: [...codex] })
  persist(after, [...codex])
}
