import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { timelineEvents } from '@/lib/db/schema';

export async function GET(_: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const data = await db
      .select()
      .from(timelineEvents)
      .where(eq(timelineEvents.project_id, params.projectId))
      .orderBy(asc(timelineEvents.created_at));
    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const body = await req.json();
  const { label, event_date_text, description, related_scene_id } = body;

  if (!label?.trim()) return NextResponse.json({ error: 'Label is required' }, { status: 400 });

  try {
    const [data] = await db
      .insert(timelineEvents)
      .values({
        project_id: params.projectId,
        label: label.trim(),
        event_date_text: event_date_text ?? '',
        description: description ?? '',
        related_scene_id: related_scene_id ?? null,
      })
      .returning();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
