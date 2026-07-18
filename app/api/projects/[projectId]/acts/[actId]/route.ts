import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { acts } from '@/lib/db/schema';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; actId: string } }
) {
  const body = await req.json();
  if (!body.title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  try {
    const [data] = await db
      .update(acts)
      .set({ title: body.title.trim() })
      .where(and(eq(acts.id, params.actId), eq(acts.project_id, params.projectId)))
      .returning();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { projectId: string; actId: string } }
) {
  try {
    await db.delete(acts).where(and(eq(acts.id, params.actId), eq(acts.project_id, params.projectId)));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
