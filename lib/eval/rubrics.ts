import type { Rubric } from './schema';

export const BRAINSTORM_RUBRIC: Rubric = {
  taskType: 'brainstorm',
  passThreshold: 0.65,
  dimensions: [
    {
      key: 'relevance',
      label: 'Scene Relevance',
      description: 'Suggestions directly address the scene\'s stated goal, conflict, and emotional tone.',
      weight: 0.35,
      min: 0,
      max: 1,
    },
    {
      key: 'originality',
      label: 'Originality',
      description: 'At least 3 of 5 suggestions offer genuinely distinct, non-clichéd approaches.',
      weight: 0.25,
      min: 0,
      max: 1,
    },
    {
      key: 'canon_consistency',
      label: 'Canon Consistency',
      description: 'No suggestion contradicts established characters, world rules, or prior events.',
      weight: 0.25,
      min: 0,
      max: 1,
    },
    {
      key: 'usefulness',
      label: 'Actionability',
      description: 'Descriptions are specific enough for a writer to act on without further clarification.',
      weight: 0.15,
      min: 0,
      max: 1,
    },
  ],
};

export const DRAFT_RUBRIC: Rubric = {
  taskType: 'draft',
  passThreshold: 0.65,
  dimensions: [
    {
      key: 'style_adherence',
      label: 'Style Adherence',
      description: 'Prose matches the style guide tone and avoids listed "dont\'s".',
      weight: 0.25,
      min: 0,
      max: 1,
    },
    {
      key: 'scene_coherence',
      label: 'Scene Coherence',
      description: 'Scene goal and conflict are clearly dramatised; the arc is complete.',
      weight: 0.3,
      min: 0,
      max: 1,
    },
    {
      key: 'character_fidelity',
      label: 'Character Fidelity',
      description: 'Characters speak and act consistently with their established voice and goals.',
      weight: 0.3,
      min: 0,
      max: 1,
    },
    {
      key: 'usefulness',
      label: 'Editorial Usefulness',
      description: 'Output is usable as a first draft with only minor edits needed.',
      weight: 0.15,
      min: 0,
      max: 1,
    },
  ],
};

export const REWRITE_RUBRIC: Rubric = {
  taskType: 'rewrite',
  passThreshold: 0.7,
  dimensions: [
    {
      key: 'instruction_followed',
      label: 'Instruction Followed',
      description: 'The rewrite specifically addresses the stated rewrite instruction.',
      weight: 0.35,
      min: 0,
      max: 1,
    },
    {
      key: 'style_preserved',
      label: 'Style Preserved',
      description: 'Author\'s voice, POV, and narrative distance are maintained.',
      weight: 0.35,
      min: 0,
      max: 1,
    },
    {
      key: 'quality_improvement',
      label: 'Quality Improvement',
      description: 'The rewritten text is objectively clearer, more engaging, or better paced.',
      weight: 0.3,
      min: 0,
      max: 1,
    },
  ],
};

export const CONTINUITY_RUBRIC: Rubric = {
  taskType: 'continuity_check',
  passThreshold: 0.7,
  dimensions: [
    {
      key: 'issues_found',
      label: 'Real Issues Found',
      description: 'All genuine continuity issues present in the scene are identified.',
      weight: 0.45,
      min: 0,
      max: 1,
    },
    {
      key: 'false_positive_rate',
      label: 'Low False Positives',
      description: 'No spurious or invented issues flagged (score 1 = zero false positives).',
      weight: 0.35,
      min: 0,
      max: 1,
    },
    {
      key: 'clarity',
      label: 'Issue Clarity',
      description: 'Each issue description is specific enough to act on.',
      weight: 0.2,
      min: 0,
      max: 1,
    },
  ],
};

export const RUBRICS: Record<string, Rubric> = {
  brainstorm: BRAINSTORM_RUBRIC,
  draft: DRAFT_RUBRIC,
  rewrite: REWRITE_RUBRIC,
  continuity_check: CONTINUITY_RUBRIC,
};

export function getRubric(taskType: string): Rubric {
  const rubric = RUBRICS[taskType];
  if (!rubric) throw new Error(`No rubric defined for task type: ${taskType}`);
  return rubric;
}
