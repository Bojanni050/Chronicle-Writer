import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { Cockpit } from '@/components/project/Cockpit';
import { Project } from '@/lib/types';

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [project] = await db.select().from(projects).where(eq(projects.id, params.projectId)).limit(1);

  if (!project) notFound();

  return (
    <Suspense>
      <Cockpit projectId={params.projectId} project={project as Project} />
    </Suspense>
  );
}
