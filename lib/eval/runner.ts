import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { evalDatasets, evalCases, evalRuns, evalResults } from '@/lib/db/schema';
import { getTextProvider } from '@/lib/ai/providers/factory';
import { getModelConfig } from '@/lib/ai/config';
import { getPromptVersion } from '@/lib/ai/prompts/registry';
import { formatContext } from '@/lib/ai/prompts/formatter';
import { buildBrainstormPrompt, parseBrainstormOutput } from '@/lib/ai/prompts/brainstorm';
import { buildDraftPrompt } from '@/lib/ai/prompts/draft';
import { buildRewritePrompt, parseRewriteOutput } from '@/lib/ai/prompts/rewrite';
import { buildContinuityPrompt, parseContinuityOutput } from '@/lib/ai/prompts/continuity';
import { getRubric } from './rubrics';
import { runJudge } from './judge';
import { summariseRun } from './scoring';
import type { EvalCaseInput } from './schema';
import type { TaskType } from '@/lib/ai/config';
import type { Scene, Character, Location, StyleGuide, ContextPack, OutlineContext, NearbyScenes, RetrievedItem, RetrievalMeta } from '@/lib/types';

export interface RunEvalOptions {
  useJudge?: boolean;
}

export interface EvalRunSummary {
  runId: string;
  datasetId: string;
  promptVersion: string;
  provider: string;
  model: string;
  totalCases: number;
  passedCases: number;
  meanScore: number;
  passRate: number;
}

function buildContextPackFromSnapshot(input: EvalCaseInput): ContextPack {
  const retrievalMeta: RetrievalMeta = {
    queryText: '',
    topK: 0,
    scoreThreshold: 0,
    metric: 'cosine',
    hitCount: 0,
    embeddingEnabled: false,
  };

  const scene: Scene = {
    ...input.sceneSnapshot,
    project_id: input.projectSnapshot.id,
    chapter_id: '',
    status: 'draft',
    order_index: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const characters: Character[] = input.characters.map((c) => ({
    ...c,
    project_id: input.projectSnapshot.id,
    photos: [],
    created_at: new Date().toISOString(),
  }));

  const locations: Location[] = input.locations.map((l) => ({
    ...l,
    project_id: input.projectSnapshot.id,
    created_at: new Date().toISOString(),
  }));

  const styleGuide: StyleGuide | null = input.styleGuide
    ? {
        id: 'eval-sg',
        project_id: input.projectSnapshot.id,
        ...input.styleGuide,
        reference_text: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null;

  const nearbyScenes: NearbyScenes = { previous: null, next: null };
  const retrievedItems: RetrievedItem[] = [];

  return {
    scene,
    outlineContext: null,
    nearbyScenes,
    pinnedEntities: [],
    characters,
    locations,
    worldbuildingNotes: [],
    timelineEvents: [],
    styleGuide,
    retrievedItems,
    retrievalMeta,
    embeddingResults: [],
  };
}

function generateOutput(task: TaskType, pack: ContextPack, userInstruction?: string) {
  const config = getModelConfig(task);
  const ctx = formatContext({
    scene: pack.scene!,
    outlineContext: pack.outlineContext,
    nearbyScenes: pack.nearbyScenes,
    characters: pack.characters,
    locations: pack.locations,
    worldbuildingNotes: pack.worldbuildingNotes,
    timelineEvents: pack.timelineEvents,
    styleGuide: pack.styleGuide,
    retrievedItems: pack.retrievedItems,
    includeContent: task === 'rewrite' || task === 'continuity_check',
  });

  const provider = getTextProvider(config.provider);

  let system: string;
  let user: string;
  let responseFormat: 'text' | 'json';

  switch (task) {
    case 'brainstorm': {
      ({ system, user } = buildBrainstormPrompt(pack.scene!, ctx, userInstruction));
      responseFormat = 'json';
      break;
    }
    case 'draft': {
      ({ system, user } = buildDraftPrompt(pack.scene!, ctx, userInstruction));
      responseFormat = 'text';
      break;
    }
    case 'rewrite': {
      ({ system, user } = buildRewritePrompt(pack.scene! as Scene & { content_md: string }, ctx, userInstruction));
      responseFormat = 'json';
      break;
    }
    case 'continuity_check': {
      ({ system, user } = buildContinuityPrompt(pack.scene! as Scene & { content_md: string }, ctx, userInstruction));
      responseFormat = 'json';
      break;
    }
  }

  return { provider, config, system, user, responseFormat };
}

function parseOutput(task: TaskType, text: string) {
  switch (task) {
    case 'brainstorm':    return parseBrainstormOutput(text);
    case 'draft':         return { draft: text };
    case 'rewrite':       return parseRewriteOutput(text);
    case 'continuity_check': return parseContinuityOutput(text);
  }
}

export async function runEvalDataset(
  datasetId: string,
  options: RunEvalOptions = {}
): Promise<EvalRunSummary> {
  const { useJudge = true } = options;

  // Load dataset + cases
  const [dataset, cases] = await Promise.all([
    db.select().from(evalDatasets).where(eq(evalDatasets.id, datasetId)).limit(1).then((r) => r[0]),
    db.select().from(evalCases).where(eq(evalCases.dataset_id, datasetId)).orderBy(evalCases.created_at),
  ]);

  if (!dataset) throw new Error('Eval dataset not found');

  const task = dataset.task_type as TaskType;
  const config = getModelConfig(task);
  const promptVersion = getPromptVersion(task);
  const rubric = getRubric(task);

  // Create eval run record
  const [runData] = await db
    .insert(evalRuns)
    .values({
      dataset_id: datasetId,
      prompt_version: promptVersion,
      provider: config.provider,
      model: config.model,
      total_cases: cases.length,
      passed_cases: 0,
    })
    .returning();

  if (!runData) throw new Error('Failed to create eval run');
  const runId = runData.id;

  const verdicts = [];

  for (const evalCase of cases) {
    let rawOutput = '';
    let parsedOutput = null;
    let judgeVerdict = null;
    let latencyMs = 0;
    let tokenUsage = null;
    let errorMsg: string | null = null;

    try {
      const input = evalCase.input_json as EvalCaseInput;
      const pack = buildContextPackFromSnapshot(input);
      const { provider, config: cfg, system, user, responseFormat } = generateOutput(task, pack, input.userInstruction);

      const startMs = Date.now();
      const result = await provider.generate({
        systemPrompt: system,
        userPrompt: user,
        model: cfg.model,
        temperature: cfg.temperature,
        maxTokens: cfg.maxTokens,
        responseFormat,
      });
      latencyMs = Date.now() - startMs;

      rawOutput = result.text;
      tokenUsage = result.usage ?? null;
      parsedOutput = parseOutput(task, rawOutput);

      if (useJudge) {
        const caseInputSummary = `Scene: ${input.sceneSnapshot.title}\nGoal: ${input.sceneSnapshot.goal}\nConflict: ${input.sceneSnapshot.conflict}`;
        judgeVerdict = await runJudge(rubric, rawOutput, caseInputSummary);
        verdicts.push(judgeVerdict);
      }
    } catch (err) {
      errorMsg = (err as Error).message;
    }

    await db.insert(evalResults).values({
      run_id: runId,
      case_id: evalCase.id,
      raw_output: rawOutput,
      parsed_output: parsedOutput as Record<string, unknown> | null,
      scores_json: judgeVerdict ? Object.fromEntries(judgeVerdict.dimensions.map((d) => [d.key, d.score])) : {},
      total_score: judgeVerdict?.totalScore ?? null,
      passed: judgeVerdict?.passed ?? false,
      judge_verdict: judgeVerdict as unknown as Record<string, unknown> | null,
      latency_ms: latencyMs,
      token_usage_json: tokenUsage as Record<string, unknown> | null,
      error: errorMsg,
    });
  }

  const summary = summariseRun(verdicts);

  await db
    .update(evalRuns)
    .set({
      passed_cases: summary.passedCount,
      mean_score: summary.meanScore,
      summary_json: {
        passRate: summary.passRate,
        passedCount: summary.passedCount,
        totalCount: summary.totalCount,
      } as Record<string, unknown>,
    })
    .where(eq(evalRuns.id, runId));

  return {
    runId,
    datasetId,
    promptVersion,
    provider: config.provider,
    model: config.model,
    totalCases: cases.length,
    passedCases: summary.passedCount,
    meanScore: summary.meanScore,
    passRate: summary.passRate,
  };
}
