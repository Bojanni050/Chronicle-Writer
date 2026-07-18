'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/lib/types';
import { NewProjectDialog } from '@/components/project/NewProjectDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookMarked, MoreVertical, Trash2, BookOpen, Clock } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-stone-100 text-stone-500',
  active: 'bg-sky-100 text-sky-600',
  complete: 'bg-emerald-100 text-emerald-600',
  archived: 'bg-stone-100 text-stone-400',
};

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProjects() {
    const res = await fetch('/api/projects');
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadProjects(); }, []);

  async function deleteProject(id: string) {
    if (!confirm('Delete this project and all its content? This cannot be undone.')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    loadProjects();
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
              <BookMarked className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-lg font-semibold text-stone-900 tracking-tight">Chronicle Writer</span>
            <span className="text-xs text-stone-400 font-normal ml-1 hidden sm:inline">
              AI Novel Cockpit
            </span>
          </div>
          <NewProjectDialog onCreated={loadProjects} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-stone-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
                Your Projects
                <span className="ml-2 text-stone-300 font-normal normal-case">({projects.length})</span>
              </h1>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => router.push(`/projects/${project.id}`)}
                  onDelete={() => deleteProject(project.id)}
                  onRefresh={loadProjects}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onDelete,
  onRefresh,
}: {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  return (
    <div
      className="group bg-white border border-stone-200 rounded-xl p-5 cursor-pointer hover:border-stone-300 hover:shadow-sm transition-all"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-stone-900 truncate leading-tight">
            {project.title}
          </h2>
          {project.genre && (
            <p className="text-xs text-stone-400 mt-0.5">{project.genre}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge className={`text-[10px] h-5 px-2 border-0 ${STATUS_STYLE[project.status] ?? STATUS_STYLE.draft} capitalize`}>
            {project.status}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 text-stone-300 hover:text-stone-500 transition-colors opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {project.premise ? (
        <p className="text-xs text-stone-500 leading-relaxed line-clamp-3 mb-3">
          {project.premise}
        </p>
      ) : (
        <p className="text-xs text-stone-300 italic mb-3">No premise yet.</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-stone-400">
          <Clock className="w-3 h-3" />
          {format(new Date(project.updated_at), 'dd MMM yyyy')}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <BookOpen className="w-3 h-3" />
          Open
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-stone-100 flex items-center justify-center mb-5">
        <BookMarked className="w-9 h-9 text-stone-300" />
      </div>
      <h2 className="text-xl font-semibold text-stone-700 mb-2">Your story starts here</h2>
      <p className="text-sm text-stone-400 max-w-sm mb-6 leading-relaxed">
        Create your first novel project to begin writing, building your story bible, and running AI-assisted scene drafts.
      </p>
      <NewProjectDialog onCreated={() => window.location.reload()} />
    </div>
  );
}
