import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { characters } from '@/lib/db/schema';

export async function GET(_: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const data = await db
      .select()
      .from(characters)
      .where(eq(characters.project_id, params.projectId))
      .orderBy(asc(characters.name));
    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const body = await req.json();
  const { name, role, description, voice_notes, secrets, goals } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  try {
    const [data] = await db
      .insert(characters)
      .values({
        project_id: params.projectId,
        name: name.trim(),
        role: role ?? '',
        description: description ?? '',
        voice_notes: voice_notes ?? '',
        secrets: secrets ?? '',
        goals: goals ?? '',
        photos: [],
      })
      .returning();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
