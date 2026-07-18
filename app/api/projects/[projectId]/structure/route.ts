import { NextRequest, NextResponse } from 'next/server';
import { asc, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { acts, chapters, scenes } from '@/lib/db/schema';
import { ActWithChapters } from '@/lib/types';

// Returns the full acts > chapters > scenes tree for the sidebar.
export async function GET(_: NextRequest, { params }: { params: { projectId: string } }) {
  const pid = params.projectId;

  try {
    const [actsData, chaptersData, scenesData] = await Promise.all([
      db.select().from(acts).where(eq(acts.project_id, pid)).orderBy(asc(acts.order_index)),
      db.select().from(chapters).where(eq(chapters.project_id, pid)).orderBy(asc(chapters.order_index)),
      db
        .select({
          id: scenes.id,
          chapter_id: scenes.chapter_id,
          title: scenes.title,
          status: scenes.status,
          order_index: scenes.order_index,
          pov: scenes.pov,
          goal: scenes.goal,
          conflict: scenes.conflict,
          emotion: scenes.emotion,
          summary: scenes.summary,
        })
        .from(scenes)
        .where(eq(scenes.project_id, pid))
        .orderBy(asc(scenes.order_index)),
    ]);

    const chaptersWithScenes = chaptersData.map((ch) => ({
      ...ch,
      scenes: scenesData.filter((s) => s.chapter_id === ch.id),
    }));

    const result = actsData.map((act) => ({
      ...act,
      chapters: chaptersWithScenes.filter((ch) => ch.act_id === act.id),
    })) as unknown as ActWithChapters[];

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// Create an act
export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const body = await req.json();
  const { type, title, act_id, chapter_id } = body;

  try {
    if (type === 'act') {
      const [existing] = await db
        .select({ order_index: acts.order_index })
        .from(acts)
        .where(eq(acts.project_id, params.projectId))
        .orderBy(desc(acts.order_index))
        .limit(1);

      const orderIndex = existing ? existing.order_index + 1 : 0;
      const [data] = await db
        .insert(acts)
        .values({ project_id: params.projectId, title: title || 'New Act', order_index: orderIndex })
        .returning();
      return NextResponse.json(data, { status: 201 });
    }

    if (type === 'chapter') {
      const [existing] = await db
        .select({ order_index: chapters.order_index })
        .from(chapters)
        .where(eq(chapters.act_id, act_id))
        .orderBy(desc(chapters.order_index))
        .limit(1);

      const orderIndex = existing ? existing.order_index + 1 : 0;
      const [data] = await db
        .insert(chapters)
        .values({ project_id: params.projectId, act_id, title: title || 'New Chapter', order_index: orderIndex })
        .returning();
      return NextResponse.json(data, { status: 201 });
    }

    if (type === 'scene') {
      const [existing] = await db
        .select({ order_index: scenes.order_index })
        .from(scenes)
        .where(eq(scenes.chapter_id, chapter_id))
        .orderBy(desc(scenes.order_index))
        .limit(1);

      const orderIndex = existing ? existing.order_index + 1 : 0;
      const [data] = await db
        .insert(scenes)
        .values({ project_id: params.projectId, chapter_id, title: title || 'New Scene', order_index: orderIndex })
        .returning();
      return NextResponse.json(data, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
