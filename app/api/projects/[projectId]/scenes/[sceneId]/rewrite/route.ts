import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiRuns } from '@/lib/db/schema';
import { getContextPackForScene } from '@/lib/retrieval/retrieval';
import { getTextProvider } from '@/lib/ai/providers/factory';
import { getModelConfig } from '@/lib/ai/config';
import { formatContext } from '@/lib/ai/prompts/formatter';
import { buildRewritePrompt, parseRewriteOutput } from '@/lib/ai/prompts/rewrite';
import { getPromptVersion } from '@/lib/ai/prompts/registry';
import { estimateCost } from '@/lib/ai/cost';

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; sceneId: string } }
) {
  const { projectId, sceneId } = params;
  const body = await req.json().catch(() => ({}));
  const userInstruction: string | undefined = body.userInstruction || undefined;

  let pack;
  try {
    pack = await getContextPackForScene(projectId, sceneId);
  } catch {
    return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
  }

  const config = getModelConfig('rewrite');
  const context = formatContext({
    scene: pack.scene!,
    outlineContext: pack.outlineContext,
    nearbyScenes: pack.nearbyScenes,
    characters: pack.characters,
    locations: pack.locations,
    worldbuildingNotes: pack.worldbuildingNotes,
    timelineEvents: pack.timelineEvents,
    styleGuide: pack.styleGuide,
    retrievedItems: pack.retrievedItems,
    includeContent: true,
  });

  const { system, user } = buildRewritePrompt(pack.scene!, context, userInstruction);
  const provider = getTextProvider(config.provider);

  const startMs = Date.now();
  let generationResult;
  try {
    generationResult = await provider.generate({
      systemPrompt: system,
      userPrompt: user,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      responseFormat: 'json',
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
  const latencyMs = Date.now() - startMs;

  const parsedOutput = parseRewriteOutput(generationResult.text);
  const costEstimate = estimateCost(
    config.model,
    generationResult.usage?.inputTokens ?? 0,
    generationResult.usage?.outputTokens ?? 0
  );

  let data;
  try {
    [data] = await db
      .insert(aiRuns)
      .values({
        project_id: projectId,
        scene_id: sceneId,
        task_type: 'rewrite',
        provider: config.provider,
        model: config.model,
        prompt_version: getPromptVersion('rewrite'),
        prompt_text: `SYSTEM:\n${system}\n\nUSER:\n${user}`,
        output_text: generationResult.text,
        parsed_json: parsedOutput as Record<string, unknown> | null,
        latency_ms: latencyMs,
        token_usage_json: {
          ...(generationResult.usage ?? {}),
          costUsd: costEstimate.totalCostUsd,
        },
        retrieval_meta_json: pack.retrievalMeta as unknown as Record<string, unknown>,
        context_manifest_json: { sceneId, retrievedCount: pack.retrievedItems.length },
      })
      .returning();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ ...data, parsedOutput, costEstimate }, { status: 201 });
}
