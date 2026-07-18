import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { planScenes } from '@/lib/db/schema';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; chapterId: string; sceneId: string } }
) {
  const body = await req.json().catch(() => ({}));
  const allowed = ['title', 'description', 'characters', 'setting', 'purpose', 'order_index'] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  try {
    const [data] = await db
      .update(planScenes)
      .set(updates)
      .where(
        and(
          eq(planScenes.id, params.sceneId),
          eq(planScenes.chapter_id, params.chapterId),
          eq(planScenes.project_id, params.projectId)
        )
      )
      .returning();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { projectId: string; chapterId: string; sceneId: string } }
) {
  try {
    await db
      .delete(planScenes)
      .where(
        and(
          eq(planScenes.id, params.sceneId),
          eq(planScenes.chapter_id, params.chapterId),
          eq(planScenes.project_id, params.projectId)
        )
      );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
