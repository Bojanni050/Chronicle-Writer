import { z } from 'zod';

// ─── Rubric primitives ────────────────────────────────────────────────────────

export const RubricDimensionSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  weight: z.number().min(0).max(1),
  min: z.number().default(0),
  max: z.number().default(1),
});

export const RubricSchema = z.object({
  taskType: z.string(),
  dimensions: z.array(RubricDimensionSchema),
  passThreshold: z.number().min(0).max(1).default(0.7),
});

export type RubricDimension = z.infer<typeof RubricDimensionSchema>;
export type Rubric = z.infer<typeof RubricSchema>;

// ─── Case I/O schemas ────────────────────────────────────────────────────────

export const EvalCaseInputSchema = z.object({
  sceneSnapshot: z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string().default(''),
    pov: z.string().default(''),
    goal: z.string().default(''),
    conflict: z.string().default(''),
    emotion: z.string().default(''),
    content_md: z.string().default(''),
  }),
  projectSnapshot: z.object({
    id: z.string(),
    title: z.string(),
    genre: z.string().default(''),
    premise: z.string().default(''),
  }),
  characters: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string().default(''),
    description: z.string().default(''),
    voice_notes: z.string().default(''),
    goals: z.string().default(''),
    secrets: z.string().default(''),
  })).default([]),
  locations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().default(''),
    rules: z.string().default(''),
    sensory_notes: z.string().default(''),
  })).default([]),
  styleGuide: z.object({
    tone: z.string().default(''),
    dos: z.string().default(''),
    donts: z.string().default(''),
  }).nullable().default(null),
  userInstruction: z.string().optional(),
});

export type EvalCaseInput = z.infer<typeof EvalCaseInputSchema>;

// ─── Dimension score ─────────────────────────────────────────────────────────

export const DimensionScoreSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number(),
  weight: z.number(),
  reasoning: z.string().default(''),
});

export type DimensionScore = z.infer<typeof DimensionScoreSchema>;

// ─── Judge verdict ───────────────────────────────────────────────────────────

export const JudgeVerdictSchema = z.object({
  dimensions: z.array(DimensionScoreSchema),
  totalScore: z.number(),
  passed: z.boolean(),
  reasoning: z.string().default(''),
});

export type JudgeVerdict = z.infer<typeof JudgeVerdictSchema>;
