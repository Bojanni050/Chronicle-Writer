import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const body = await req.json().catch(() => ({}));
  const allowed = ['plan_template', 'plot_summary_short', 'plot_summary_expanded'] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  try {
    const [data] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, params.projectId))
      .returning({
        plan_template: projects.plan_template,
        plot_summary_short: projects.plot_summary_short,
        plot_summary_expanded: projects.plot_summary_expanded,
      });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
