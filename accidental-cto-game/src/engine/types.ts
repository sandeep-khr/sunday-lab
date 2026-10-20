export interface Effects {
  reliability?: number
  speed?: number
  morale?: number
  debt?: number
  reputation?: number
  cash?: number
}

export interface DeepDive {
  title: string
  body: string
}

export interface Check {
  id: string
  label: string
  cmd?: string
  out: string
  clue?: string
}

export interface Fix {
  id: string
  label: string
  requires: string[]
  effects: Effects
  unlock?: string
  deepDive?: DeepDive
  successText: string
  lesson: string
  failEffects?: Effects
  failText: string
}

export interface Investigation {
  briefing: string[]
  checks: Check[]
  fixes: Fix[]
}

export interface Choice {
  id: string
  label: string
  detail: string
  effects: Effects
  setFlags?: string[]
  unlock?: string
  deepDive?: DeepDive
  result: string
  lesson: string
}

export interface Scene {
  kind?: 'choices' | 'investigation'
  prompt?: string
  choices?: Choice[]
  investigation?: Investigation
}

export interface Quiz {
  q: string
  options: [string, string, string]
  answer: 0 | 1 | 2
  explain: string
}

export interface Chapter {
  id: string
  act: number
  num: string
  title: string
  tagline: string
  art?: string
  story: string[]
  ambient?: string[]
  scenes: Scene[]
  quiz?: Quiz
  codex?: string[]
  surge: number
}
