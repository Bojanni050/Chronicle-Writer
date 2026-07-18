import { NextRequest, NextResponse } from 'next/server';
import { desc, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { evalRuns, evalDatasets } from '@/lib/db/schema';

export async function GET(_req: NextRequest) {
  try {
    const runs = await db
      .select()
      .from(evalRuns)
      .orderBy(desc(evalRuns.created_at))
      .limit(50);

    const datasetIds = Array.from(new Set(runs.map((r) => r.dataset_id)));
    const datasets = datasetIds.length
      ? await db
          .select({ id: evalDatasets.id, name: evalDatasets.name, task_type: evalDatasets.task_type })
          .from(evalDatasets)
          .where(inArray(evalDatasets.id, datasetIds))
      : [];
    const datasetMap = new Map(datasets.map((d) => [d.id, { name: d.name, task_type: d.task_type }]));

    const data = runs.map((r) => ({ ...r, eval_datasets: datasetMap.get(r.dataset_id) ?? null }));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
