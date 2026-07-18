import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sceneVersions } from '@/lib/db/schema';

export async function GET(
  _: NextRequest,
  { params }: { params: { projectId: string; sceneId: string } }
) {
  try {
    const data = await db
      .select({
        id: sceneVersions.id,
        word_count: sceneVersions.word_count,
        created_at: sceneVersions.created_at,
      })
      .from(sceneVersions)
      .where(eq(sceneVersions.scene_id, params.sceneId))
      .orderBy(desc(sceneVersions.created_at))
      .limit(20);

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
