import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { evalRuns, evalDatasets, evalResults, evalCases } from '@/lib/db/schema';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [run] = await db
      .select()
      .from(evalRuns)
      .where(eq(evalRuns.id, params.id))
      .limit(1);

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const [dataset] = await db
      .select({ name: evalDatasets.name, task_type: evalDatasets.task_type, project_id: evalDatasets.project_id })
      .from(evalDatasets)
      .where(eq(evalDatasets.id, run.dataset_id))
      .limit(1);

    const results = await db
      .select()
      .from(evalResults)
      .where(eq(evalResults.run_id, params.id))
      .orderBy(evalResults.created_at);

    const caseIds = Array.from(new Set(results.map((r) => r.case_id)));
    const cases = caseIds.length
      ? await db
          .select({ id: evalCases.id, label: evalCases.label })
          .from(evalCases)
          .where(inArray(evalCases.id, caseIds))
      : [];
    const caseMap = new Map(cases.map((c) => [c.id, { label: c.label }]));

    const resultsWithCases = results.map((r) => ({ ...r, eval_cases: caseMap.get(r.case_id) ?? null }));

    return NextResponse.json({
      run: { ...run, eval_datasets: dataset ?? null },
      results: resultsWithCases,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
