import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aiRuns } from '@/lib/db/schema';
import { runAiTask, TaskType, ContextManifest } from '@/lib/ai/tasks';

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const body = await req.json();
  const { scene_id, task_type, context, user_instruction, provider, model } = body;

  if (!task_type) return NextResponse.json({ error: 'task_type is required' }, { status: 400 });

  const result = await runAiTask({
    taskType: task_type as TaskType,
    context: (context ?? {}) as ContextManifest,
    userInstruction: user_instruction,
    provider: provider ?? 'stub',
    model: model ?? 'stub',
  });

  try {
    const [data] = await db
      .insert(aiRuns)
      .values({
        project_id: params.projectId,
        scene_id: scene_id ?? null,
        task_type,
        provider: result.provider,
        model: result.model,
        prompt_text: result.promptText,
        output_text: result.outputText,
        context_manifest_json: result.contextManifestJson as Record<string, unknown>,
      })
      .returning();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(_: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const data = await db
      .select({
        id: aiRuns.id,
        scene_id: aiRuns.scene_id,
        task_type: aiRuns.task_type,
        provider: aiRuns.provider,
        model: aiRuns.model,
        output_text: aiRuns.output_text,
        created_at: aiRuns.created_at,
      })
      .from(aiRuns)
      .where(eq(aiRuns.project_id, params.projectId))
      .orderBy(desc(aiRuns.created_at))
      .limit(50);
    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
