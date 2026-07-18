import { NextRequest, NextResponse } from 'next/server';
import { seedEvalDatasets } from '@/lib/eval/seed';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  try {
    await seedEvalDatasets(body.projectId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
