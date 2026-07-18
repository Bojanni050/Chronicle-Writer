import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { timelineEvents } from '@/lib/db/schema';

export async function PATCH(req: NextRequest, { params }: { params: { projectId: string; eventId: string } }) {
  const body = await req.json();
  const allowed = ['label', 'event_date_text', 'description', 'related_scene_id'] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  try {
    const [data] = await db
      .update(timelineEvents)
      .set(updates)
      .where(and(eq(timelineEvents.id, params.eventId), eq(timelineEvents.project_id, params.projectId)))
      .returning();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { projectId: string; eventId: string } }) {
  try {
    await db
      .delete(timelineEvents)
      .where(and(eq(timelineEvents.id, params.eventId), eq(timelineEvents.project_id, params.projectId)));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
