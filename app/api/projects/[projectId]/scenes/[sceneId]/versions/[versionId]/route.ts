import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sceneVersions } from '@/lib/db/schema';

export async function GET(
  _: NextRequest,
  { params }: { params: { projectId: string; sceneId: string; versionId: string } }
) {
  try {
    const [data] = await db
      .select()
      .from(sceneVersions)
      .where(and(eq(sceneVersions.id, params.versionId), eq(sceneVersions.scene_id, params.sceneId)))
      .limit(1);

    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
