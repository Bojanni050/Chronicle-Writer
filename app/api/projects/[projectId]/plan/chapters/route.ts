import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { planChapters } from '@/lib/db/schema';

export async function GET(_: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const data = await db.query.planChapters.findMany({
      where: eq(planChapters.project_id, params.projectId),
      orderBy: (chapters, { asc }) => [asc(chapters.order_index)],
      with: {
        plan_scenes: {
          orderBy: (scenes, { asc }) => [asc(scenes.order_index)],
        },
      },
    });
    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const body = await req.json().catch(() => ({}));

  try {
    const [existing] = await db
      .select({ order_index: planChapters.order_index })
      .from(planChapters)
      .where(eq(planChapters.project_id, params.projectId))
      .orderBy(desc(planChapters.order_index))
      .limit(1);

    const nextIndex = (existing?.order_index ?? -1) + 1;

    const [data] = await db
      .insert(planChapters)
      .values({
        project_id: params.projectId,
        title: body.title ?? 'New Chapter',
        summary: body.summary ?? '',
        pov_character: body.pov_character ?? '',
        status: body.status ?? 'planned',
        order_index: body.order_index ?? nextIndex,
      })
      .returning();

    return NextResponse.json({ ...data, plan_scenes: [] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
