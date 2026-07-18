import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { planScenes } from '@/lib/db/schema';

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string; chapterId: string } }
) {
  const body = await req.json().catch(() => ({}));

  try {
    const [existing] = await db
      .select({ order_index: planScenes.order_index })
      .from(planScenes)
      .where(eq(planScenes.chapter_id, params.chapterId))
      .orderBy(desc(planScenes.order_index))
      .limit(1);

    const nextIndex = (existing?.order_index ?? -1) + 1;

    const [data] = await db
      .insert(planScenes)
      .values({
        project_id: params.projectId,
        chapter_id: params.chapterId,
        title: body.title ?? 'New Scene',
        description: body.description ?? '',
        characters: body.characters ?? '',
        setting: body.setting ?? '',
        purpose: body.purpose ?? 'plot',
        order_index: body.order_index ?? nextIndex,
      })
      .returning();

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
