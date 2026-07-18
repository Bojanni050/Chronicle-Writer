import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { worldbuildingNotes } from '@/lib/db/schema';

export async function GET(_: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const data = await db
      .select()
      .from(worldbuildingNotes)
      .where(eq(worldbuildingNotes.project_id, params.projectId))
      .orderBy(asc(worldbuildingNotes.category), asc(worldbuildingNotes.title));
    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const body = await req.json();
  const { category, title, content_md } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  try {
    const [data] = await db
      .insert(worldbuildingNotes)
      .values({
        project_id: params.projectId,
        category: category ?? 'general',
        title: title.trim(),
        content_md: content_md ?? '',
      })
      .returning();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
