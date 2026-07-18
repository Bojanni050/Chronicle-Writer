import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { locations } from '@/lib/db/schema';

export async function GET(_: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const data = await db
      .select()
      .from(locations)
      .where(eq(locations.project_id, params.projectId))
      .orderBy(asc(locations.name));
    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const body = await req.json();
  const { name, description, rules, sensory_notes } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  try {
    const [data] = await db
      .insert(locations)
      .values({
        project_id: params.projectId,
        name: name.trim(),
        description: description ?? '',
        rules: rules ?? '',
        sensory_notes: sensory_notes ?? '',
      })
      .returning();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
