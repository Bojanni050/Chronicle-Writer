import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { planChapters } from '@/lib/db/schema';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; chapterId: string } }
) {
  const body = await req.json().catch(() => ({}));
  const allowed = ['title', 'summary', 'pov_character', 'status', 'order_index'] as const;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  try {
    const [data] = await db
      .update(planChapters)
      .set(updates)
      .where(and(eq(planChapters.id, params.chapterId), eq(planChapters.project_id, params.projectId)))
      .returning();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { projectId: string; chapterId: string } }
) {
  try {
    await db
      .delete(planChapters)
      .where(and(eq(planChapters.id, params.chapterId), eq(planChapters.project_id, params.projectId)));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
