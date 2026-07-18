import { NextRequest, NextResponse } from 'next/server';
import { runEvalDataset } from '@/lib/eval/runner';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => ({}));
  const useJudge = body.useJudge !== false;

  try {
    const summary = await runEvalDataset(params.id, { useJudge });
    return NextResponse.json(summary, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
