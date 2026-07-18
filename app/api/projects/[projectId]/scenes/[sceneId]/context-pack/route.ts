import { NextRequest, NextResponse } from 'next/server';
import { getContextPackForScene } from '@/lib/retrieval/retrieval';

export async function GET(
  _: NextRequest,
  { params }: { params: { projectId: string; sceneId: string } }
) {
  try {
    const pack = await getContextPackForScene(params.projectId, params.sceneId);
    return NextResponse.json(pack);
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'Scene not found') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
