import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { worldbuildingNotes } from '@/lib/db/schema';

export async function PATCH(req: NextRequest, { params }: { params: { projectId: string; noteId: string } }) {
  const body = await req.json();
  const allowed = ['category', 'title', 'content_md'] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  try {
    const [data] = await db
      .update(worldbuildingNotes)
      .set(updates)
      .where(and(eq(worldbuildingNotes.id, params.noteId), eq(worldbuildingNotes.project_id, params.projectId)))
      .returning();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { projectId: string; noteId: string } }) {
  try {
    await db
      .delete(worldbuildingNotes)
      .where(and(eq(worldbuildingNotes.id, params.noteId), eq(worldbuildingNotes.project_id, params.projectId)));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
