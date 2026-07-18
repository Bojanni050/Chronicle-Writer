import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { styleGuides } from '@/lib/db/schema';

export async function GET(_: NextRequest, { params }: { params: { projectId: string } }) {
  try {
    const [data] = await db
      .select()
      .from(styleGuides)
      .where(eq(styleGuides.project_id, params.projectId))
      .limit(1);
    return NextResponse.json(data ?? null);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { projectId: string } }) {
  const body = await req.json();
  const { tone, dos, donts, reference_text } = body;

  try {
    const [existing] = await db
      .select({ id: styleGuides.id })
      .from(styleGuides)
      .where(eq(styleGuides.project_id, params.projectId))
      .limit(1);

    if (existing) {
      const [data] = await db
        .update(styleGuides)
        .set({ tone: tone ?? '', dos: dos ?? '', donts: donts ?? '', reference_text: reference_text ?? '' })
        .where(eq(styleGuides.id, existing.id))
        .returning();
      return NextResponse.json(data);
    }

    const [data] = await db
      .insert(styleGuides)
      .values({
        project_id: params.projectId,
        tone: tone ?? '',
        dos: dos ?? '',
        donts: donts ?? '',
        reference_text: reference_text ?? '',
      })
      .returning();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
