import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { evalDatasets } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  try {
    const data = await db
      .select()
      .from(evalDatasets)
      .where(projectId ? eq(evalDatasets.project_id, projectId) : undefined)
      .orderBy(desc(evalDatasets.created_at));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.projectId || !body?.name || !body?.taskType) {
    return NextResponse.json({ error: 'projectId, name, and taskType are required' }, { status: 400 });
  }

  try {
    const [data] = await db
      .insert(evalDatasets)
      .values({
        project_id: body.projectId,
        name: body.name,
        description: body.description ?? '',
        task_type: body.taskType,
      })
      .returning();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
