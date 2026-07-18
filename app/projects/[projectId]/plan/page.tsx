import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects, planChapters, planScenes } from '@/lib/db/schema';
import { PlanPage } from '@/components/plan/PlanPage';

export default async function PlanningPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [project, chapters] = await Promise.all([
    db
      .select({
        id: projects.id,
        title: projects.title,
        genre: projects.genre,
        premise: projects.premise,
        status: projects.status,
        plan_template: projects.plan_template,
        plot_summary_short: projects.plot_summary_short,
        plot_summary_expanded: projects.plot_summary_expanded,
      })
      .from(projects)
      .where(eq(projects.id, params.projectId))
      .limit(1)
      .then((r) => r[0] ?? null),
    db.query.planChapters.findMany({
      where: eq(planChapters.project_id, params.projectId),
      orderBy: asc(planChapters.order_index),
      with: {
        plan_scenes: { orderBy: asc(planScenes.order_index) },
      },
    }),
  ]);

  if (!project) notFound();

  return (
    <PlanPage
      projectId={params.projectId}
      project={project as any}
      initialChapters={(chapters ?? []) as any}
    />
  );
}
