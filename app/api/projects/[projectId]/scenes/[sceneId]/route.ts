import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { scenes, sceneVersions } from '@/lib/db/schema';

export async function GET(
  _: NextRequest,
  { params }: { params: { projectId: string; sceneId: string } }
) {
  try {
    const [data] = await db
      .select()
      .from(scenes)
      .where(and(eq(scenes.id, params.sceneId), eq(scenes.project_id, params.projectId)))
      .limit(1);

    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; sceneId: string } }
) {
  const body = await req.json();
  const allowed = ['title', 'summary', 'content_md', 'pov', 'goal', 'conflict', 'emotion', 'status', 'order_index'] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  let data;
  try {
    [data] = await db
      .update(scenes)
      .set(updates)
      .where(and(eq(scenes.id, params.sceneId), eq(scenes.project_id, params.projectId)))
      .returning();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  // Version snapshot — only when content_md actually changed from the last version
  if ('content_md' in body) {
    const [lastVersion] = await db
      .select({ content_md: sceneVersions.content_md })
      .from(sceneVersions)
      .where(eq(sceneVersions.scene_id, params.sceneId))
      .orderBy(desc(sceneVersions.created_at))
      .limit(1);

    const newContent = body.content_md as string;
    if (!lastVersion || lastVersion.content_md !== newContent) {
      const wordCount = newContent.split(/\s+/).filter(Boolean).length;
      await db.insert(sceneVersions).values({
        scene_id: params.sceneId,
        content_md: newContent,
        word_count: wordCount,
      });

      // Trim to 20 most recent versions
      const allVersions = await db
        .select({ id: sceneVersions.id })
        .from(sceneVersions)
        .where(eq(sceneVersions.scene_id, params.sceneId))
        .orderBy(desc(sceneVersions.created_at));
      if (allVersions.length > 20) {
        const toDelete = allVersions.slice(20).map((v) => v.id);
        await db.delete(sceneVersions).where(inArray(sceneVersions.id, toDelete));
      }
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { projectId: string; sceneId: string } }
) {
  try {
    await db.delete(scenes).where(and(eq(scenes.id, params.sceneId), eq(scenes.project_id, params.projectId)));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
