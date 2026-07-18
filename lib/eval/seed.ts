import { db } from '@/lib/db';
import { evalDatasets, evalCases } from '@/lib/db/schema';
import type { EvalCaseInput } from './schema';

// Two golden cases per task type.
// These use fully self-contained snapshots — no live DB reads needed during eval.

const PROJECT_SNAPSHOT = {
  id: 'seed-project-1',
  title: 'The Glass Meridian',
  genre: 'Science Fiction',
  premise: 'A cartographer discovers that the maps she draws reshape the territories they represent, forcing her to choose between remaking the world and preserving what little remains of it.',
};

const CHARACTERS = [
  {
    id: 'char-1',
    name: 'Mara Voss',
    role: 'Protagonist',
    description: 'A meticulous cartographer in her late 30s. Quiet, methodical, haunted by the death of her mentor.',
    voice_notes: 'Speaks in precise, measured sentences. Avoids metaphor. Uses technical terminology.',
    goals: 'Understand the true nature of her maps before someone weaponises the ability.',
    secrets: 'She already used the ability once to erase a border town — and the people in it.',
  },
  {
    id: 'char-2',
    name: 'Director Lenz',
    role: 'Antagonist',
    description: 'Head of the Meridian Institute. Pragmatic idealist who believes controlled reality-editing will end all wars.',
    voice_notes: 'Warm, persuasive, never raises his voice. Always refers to Mara by her title.',
    goals: 'Secure the maps and use them to redraw national borders — eliminating disputed territories.',
    secrets: 'He orchestrated the mentor\'s death to trigger Mara\'s ability.',
  },
];

const LOCATIONS = [
  {
    id: 'loc-1',
    name: 'The Cartography Vault',
    description: 'A subterranean archive beneath the Institute. Rows of steel drawers containing original survey maps.',
    rules: 'No originals may leave the vault. All copies must be countersigned.',
    sensory_notes: 'Smell of old paper and machine oil. Fluorescent hum. Temperature kept at 15°C.',
  },
];

const STYLE_GUIDE = {
  tone: 'Precise, unsettling, literary SF. Inspired by Le Guin and Ishiguro. Close third-person.',
  dos: 'Ground abstract concepts in specific sensory detail. Let silence carry weight. Favour understatement.',
  donts: 'No info-dumps. No exclamation marks. Never state emotion directly — show it through action and detail.',
};

const BRAINSTORM_CASES: Array<{ label: string; input: EvalCaseInput }> = [
  {
    label: 'Brainstorm: Mara discovers the map rewrites worked',
    input: {
      sceneSnapshot: {
        id: 'scene-b1',
        title: 'The Proof',
        summary: 'Mara finds satellite imagery confirming that her hand-drawn corrections reshaped real geography.',
        pov: 'Mara Voss',
        goal: 'She must confront the proof of what she can do.',
        conflict: 'Accepting the truth means accepting guilt for the town she erased.',
        emotion: 'Dread mixed with terrible awe',
        content_md: '',
      },
      projectSnapshot: PROJECT_SNAPSHOT,
      characters: CHARACTERS,
      locations: LOCATIONS,
      styleGuide: STYLE_GUIDE,
      userInstruction: 'Generate 5 distinct scene directions that each handle the revelation differently.',
    },
  },
  {
    label: 'Brainstorm: Director Lenz makes his offer',
    input: {
      sceneSnapshot: {
        id: 'scene-b2',
        title: 'The Offer',
        summary: 'Director Lenz presents Mara with a government contract to redraw the Kessler Line — a disputed border responsible for decades of conflict.',
        pov: 'Mara Voss',
        goal: 'Mara must hear the offer and decide whether to stay in the room.',
        conflict: 'The offer is genuinely compelling — the outcome would save lives. But the cost is complicity.',
        emotion: 'Revulsion, temptation, fear of herself',
        content_md: '',
      },
      projectSnapshot: PROJECT_SNAPSHOT,
      characters: CHARACTERS,
      locations: LOCATIONS,
      styleGuide: STYLE_GUIDE,
    },
  },
];

const CONTINUITY_CASES: Array<{ label: string; input: EvalCaseInput }> = [
  {
    label: 'Continuity: Scene with deliberate character contradiction',
    input: {
      sceneSnapshot: {
        id: 'scene-c1',
        title: 'The Confrontation',
        summary: 'Mara confronts Director Lenz about her mentor\'s death.',
        pov: 'Mara Voss',
        goal: 'Force Lenz to admit his role.',
        conflict: 'Lenz denies everything with perfect calm.',
        emotion: 'Cold fury',
        content_md: `Mara slammed her fist on the desk. "You killed him!" she shouted, her voice breaking into sobs.

Lenz leaned back, smiling broadly, his voice rising to match her: "Prove it! You have nothing!"

She pulled out the satellite photo. Lenz's expression crumpled in obvious guilt, and he began to sweat.`,
      },
      projectSnapshot: PROJECT_SNAPSHOT,
      characters: CHARACTERS,
      locations: LOCATIONS,
      styleGuide: STYLE_GUIDE,
    },
  },
  {
    label: 'Continuity: Clean scene — no issues expected',
    input: {
      sceneSnapshot: {
        id: 'scene-c2',
        title: 'The Archive',
        summary: 'Mara works alone in the Cartography Vault, cataloguing pre-war survey maps.',
        pov: 'Mara Voss',
        goal: 'Find evidence that the maps\' power predates her.',
        conflict: 'The files are incomplete — someone has removed pages.',
        emotion: 'Quiet, methodical dread',
        content_md: `The vault smelled of machine oil and old paper. Mara worked methodically through drawer seven, checking each map against the register. Drawer eight was where the pre-war surveys began.

She opened it. The first dozen maps were intact: survey dates, countersignatures, the Institute's blue stamp. Then a gap — three consecutive entries in the register, no corresponding maps.

She noted the gap in her log using the precise notation her mentor had taught her. She did not allow herself to speculate about what this meant. Not yet.`,
      },
      projectSnapshot: PROJECT_SNAPSHOT,
      characters: CHARACTERS,
      locations: LOCATIONS,
      styleGuide: STYLE_GUIDE,
    },
  },
];

const DRAFT_CASES: Array<{ label: string; input: EvalCaseInput }> = [
  {
    label: 'Draft: Mara opens the sealed envelope',
    input: {
      sceneSnapshot: {
        id: 'scene-d1',
        title: 'The Envelope',
        summary: 'Mara\'s mentor left a sealed envelope to be opened after his death. She finally opens it.',
        pov: 'Mara Voss',
        goal: 'Read the letter. Understand what he knew.',
        conflict: 'The letter reveals he knew about her ability before she did — and approved of her using it.',
        emotion: 'Grief shifting into betrayal',
        content_md: '',
      },
      projectSnapshot: PROJECT_SNAPSHOT,
      characters: [CHARACTERS[0]],
      locations: LOCATIONS,
      styleGuide: STYLE_GUIDE,
    },
  },
];

const REWRITE_CASES: Array<{ label: string; input: EvalCaseInput }> = [
  {
    label: 'Rewrite: Improve pacing of confrontation opening',
    input: {
      sceneSnapshot: {
        id: 'scene-r1',
        title: 'First Contact',
        summary: 'Mara meets Director Lenz for the first time at a cartography conference.',
        pov: 'Mara Voss',
        goal: 'Establish wariness — she senses something wrong about him without knowing why.',
        conflict: 'He is charming and she cannot find a rational reason to distrust him.',
        emotion: 'Unease beneath professional politeness',
        content_md: `Mara met Director Lenz at the conference. He was very tall and had grey hair. He shook her hand and smiled. She felt uncomfortable but didn't know why. He talked about her work and seemed to know a lot about her maps. She answered his questions but kept her answers short. He gave her his card. She took it.`,
      },
      projectSnapshot: PROJECT_SNAPSHOT,
      characters: CHARACTERS,
      locations: [],
      styleGuide: STYLE_GUIDE,
      userInstruction: 'Rewrite with the style guide\'s close-third voice and sensory grounding. Remove all telling, show only through action and detail.',
    },
  },
];

export const SEED_CASES = [
  ...BRAINSTORM_CASES.map((c) => ({ ...c, taskType: 'brainstorm' })),
  ...DRAFT_CASES.map((c) => ({ ...c, taskType: 'draft' })),
  ...REWRITE_CASES.map((c) => ({ ...c, taskType: 'rewrite' })),
  ...CONTINUITY_CASES.map((c) => ({ ...c, taskType: 'continuity_check' })),
];

export async function seedEvalDatasets(projectId: string): Promise<void> {
  const taskTypes = ['brainstorm', 'draft', 'rewrite', 'continuity_check'] as const;

  for (const taskType of taskTypes) {
    const cases = SEED_CASES.filter((c) => c.taskType === taskType);
    if (cases.length === 0) continue;

    let dataset;
    try {
      [dataset] = await db
        .insert(evalDatasets)
        .values({
          project_id: projectId,
          name: `Golden set: ${taskType}`,
          description: `Seed golden cases for the ${taskType} task. Use these to detect regressions.`,
          task_type: taskType,
        })
        .returning();
    } catch (err) {
      console.error(`Failed to seed dataset for ${taskType}:`, (err as Error).message);
      continue;
    }

    if (!dataset) continue;
    const datasetId = dataset.id;

    await db.insert(evalCases).values(
      cases.map((c) => ({
        dataset_id: datasetId,
        label: c.label,
        input_json: c.input as unknown as Record<string, unknown>,
      }))
    );
  }
}
