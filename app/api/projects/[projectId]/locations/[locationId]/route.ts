import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { locations } from '@/lib/db/schema';

export async function GET(_: NextRequest, { params }: { params: { projectId: string; locationId: string } }) {
  try {
    const [data] = await db
      .select()
      .from(locations)
      .where(and(eq(locations.id, params.locationId), eq(locations.project_id, params.projectId)))
      .limit(1);

    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { projectId: string; locationId: string } }) {
  const body = await req.json();
  const allowed = ['name', 'description', 'rules', 'sensory_notes'] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  try {
    const [data] = await db
      .update(locations)
      .set(updates)
      .where(and(eq(locations.id, params.locationId), eq(locations.project_id, params.projectId)))
      .returning();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { projectId: string; locationId: string } }) {
  try {
    await db
      .delete(locations)
      .where(and(eq(locations.id, params.locationId), eq(locations.project_id, params.projectId)));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
