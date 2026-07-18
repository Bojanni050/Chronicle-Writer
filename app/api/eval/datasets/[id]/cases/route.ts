import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { evalCases } from '@/lib/db/schema';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await db
      .select()
      .from(evalCases)
      .where(eq(evalCases.dataset_id, params.id))
      .orderBy(evalCases.created_at);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body?.label || !body?.inputJson) {
    return NextResponse.json({ error: 'label and inputJson are required' }, { status: 400 });
  }

  try {
    const [data] = await db
      .insert(evalCases)
      .values({
        dataset_id: params.id,
        label: body.label,
        input_json: body.inputJson,
        golden_output_json: body.goldenOutputJson ?? null,
        notes: body.notes ?? '',
      })
      .returning();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
