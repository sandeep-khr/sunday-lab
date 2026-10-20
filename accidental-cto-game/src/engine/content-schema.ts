import { z } from 'zod'
import type { Chapter } from './types'

const EffectsSchema = z
  .object({
    reliability: z.number().optional(),
    speed: z.number().optional(),
    morale: z.number().optional(),
    debt: z.number().optional(),
    reputation: z.number().optional(),
    cash: z.number().optional(),
  })
  .strict()

const DeepDiveSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
})

const ChoiceSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  detail: z.string().min(1),
  effects: EffectsSchema,
  setFlags: z.array(z.string()).optional(),
  unlock: z.string().optional(),
  deepDive: DeepDiveSchema.optional(),
  result: z.string().min(1),
  lesson: z.string().min(1),
})

const CheckSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  cmd: z.string().optional(),
  out: z.string().min(1),
  clue: z.string().optional(),
})

const FixSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  requires: z.array(z.string()),
  effects: EffectsSchema,
  unlock: z.string().optional(),
  deepDive: DeepDiveSchema.optional(),
  successText: z.string().min(1),
  lesson: z.string().min(1),
  failEffects: EffectsSchema.optional(),
  failText: z.string().optional(),
})

const InvestigationSchema = z.object({
  briefing: z.array(z.string()).min(1),
  checks: z.array(CheckSchema).min(2),
  fixes: z.array(FixSchema).min(2),
})

const SceneSchema = z
  .object({
    kind: z.enum(['choices', 'investigation']).optional(),
    prompt: z.string().optional(),
    choices: z.array(ChoiceSchema).min(2).max(3).optional(),
    investigation: InvestigationSchema.optional(),
  })
  .refine((s) => (s.kind === 'investigation' ? !!s.investigation : !!s.prompt && !!s.choices), {
    message: 'scene must match its kind',
  })

const QuizSchema = z.object({
  q: z.string().min(1),
  options: z.tuple([z.string(), z.string(), z.string()]),
  answer: z.number().int().min(0).max(2),
  explain: z.string().min(1),
})

export const ChapterSchema = z.object({
  id: z.string(),
  act: z.number().int().min(1),
  num: z.string(),
  title: z.string().min(1),
  tagline: z.string().min(1),
  art: z.string().optional(),
  story: z.array(z.string()).min(1),
  ambient: z.array(z.string()).optional(),
  scenes: z.array(SceneSchema).min(1),
  quiz: QuizSchema.optional(),
  codex: z.array(z.string()).optional(),
  surge: z.number().positive(),
})

export const ChaptersSchema = z.array(ChapterSchema)

export function parseChapters(raw: unknown): Chapter[] {
  return ChaptersSchema.parse(raw) as Chapter[]
}
