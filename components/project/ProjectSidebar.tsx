'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ActWithChapters } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  ChevronRight, ChevronDown, Plus, BookOpen, FileText,
  Layers, BookMarked, MoreHorizontal, Trash2, Pencil, Check, X,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ProjectSidebarProps {
  projectId: string;
  projectTitle: string;
  acts: ActWithChapters[];
  selectedSceneId: string | null;
  onSelectScene: (sceneId: string) => void;
  onStructureChange: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-stone-400',
  written: 'bg-sky-400',
  revised: 'bg-amber-400',
  final: 'bg-emerald-500',
};

// Inline rename input — auto-focuses, saves on Enter/blur, cancels on Escape
function InlineRenameInput({
  initial,
  onSave,
  onCancel,
}: {
  initial: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  function commit() {
    const v = value.trim();
    if (v && v !== initial) onSave(v);
    else onCancel();
  }

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') onCancel();
        e.stopPropagation();
      }}
      className="flex-1 min-w-0 bg-stone-800 text-stone-100 text-xs rounded px-1.5 py-0.5 border border-stone-500 outline-none"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export function ProjectSidebar({
  projectId, projectTitle, acts, selectedSceneId, onSelectScene, onStructureChange,
}: ProjectSidebarProps) {
  const [collapsedActs, setCollapsedActs] = useState<Set<string>>(new Set());
  const [collapsedChapters, setCollapsedChapters] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const toggleAct = (id: string) => setCollapsedActs((s) => toggle(s, id));
  const toggleChapter = (id: string) => setCollapsedChapters((s) => toggle(s, id));
  function toggle(s: Set<string>, id: string) {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  }

  const addNode = useCallback(
    async (type: 'act' | 'chapter' | 'scene', parentId?: string) => {
      const body: Record<string, unknown> = { type };
      if (type === 'chapter') body.act_id = parentId;
      if (type === 'scene') body.chapter_id = parentId;
      const res = await fetch(`/api/projects/${projectId}/structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) onStructureChange();
    },
    [projectId, onStructureChange]
  );

  const renameAct = useCallback(
    async (actId: string, title: string) => {
      await fetch(`/api/projects/${projectId}/acts/${actId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      setRenamingId(null);
      onStructureChange();
    },
    [projectId, onStructureChange]
  );

  const renameChapter = useCallback(
    async (chapterId: string, title: string) => {
      await fetch(`/api/projects/${projectId}/chapters/${chapterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      setRenamingId(null);
      onStructureChange();
    },
    [projectId, onStructureChange]
  );

  const renameScene = useCallback(
    async (sceneId: string, title: string) => {
      await fetch(`/api/projects/${projectId}/scenes/${sceneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      setRenamingId(null);
      onStructureChange();
    },
    [projectId, onStructureChange]
  );

  const deleteAct = useCallback(
    async (actId: string, actTitle: string) => {
      if (!confirm(`Delete "${actTitle}" and all its chapters and scenes? This cannot be undone.`)) return;
      await fetch(`/api/projects/${projectId}/acts/${actId}`, { method: 'DELETE' });
      onStructureChange();
    },
    [projectId, onStructureChange]
  );

  const deleteChapter = useCallback(
    async (chapterId: string, chapterTitle: string, sceneCount: number) => {
      const warning = sceneCount > 0
        ? `Delete "${chapterTitle}" and its ${sceneCount} scene(s)? This cannot be undone.`
        : `Delete "${chapterTitle}"?`;
      if (!confirm(warning)) return;
      await fetch(`/api/projects/${projectId}/chapters/${chapterId}`, { method: 'DELETE' });
      onStructureChange();
    },
    [projectId, onStructureChange]
  );

  const deleteScene = useCallback(
    async (sceneId: string, sceneTitle: string) => {
      if (!confirm(`Delete scene "${sceneTitle}"? This cannot be undone.`)) return;
      await fetch(`/api/projects/${projectId}/scenes/${sceneId}`, { method: 'DELETE' });
      onStructureChange();
    },
    [projectId, onStructureChange]
  );

  return (
    <div className="flex flex-col h-full bg-stone-900 text-stone-100 select-none">
      {/* Project title */}
      <div className="px-4 py-4 border-b border-stone-700/50">
        <div className="flex items-center gap-1.5 mb-2">
          <BookMarked className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-[10px] font-semibold tracking-widest uppercase text-amber-400/80">Chronicle Writer</span>
        </div>
        <p className="text-sm font-medium text-stone-100 truncate leading-snug">{projectTitle}</p>
      </div>

      {/* Story Bible */}
      <a
        href={`/projects/${projectId}/story-bible`}
        className="flex items-center gap-2 px-4 py-2.5 text-xs text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 transition-colors border-b border-stone-700/30"
      >
        <BookOpen className="w-3.5 h-3.5" />
        Story Bible
      </a>

      {/* Plan */}
      <a
        href={`/projects/${projectId}/plan`}
        className="flex items-center gap-2 px-4 py-2.5 text-xs text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 transition-colors border-b border-stone-700/30"
      >
        <Layers className="w-3.5 h-3.5" />
        Novel Plan
      </a>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {acts.length === 0 && (
          <p className="px-4 py-6 text-xs text-stone-500 text-center">
            No acts yet.
          </p>
        )}

        {acts.map((act) => (
          <div key={act.id}>
            {/* Act row */}
            <div className="group flex items-center gap-0.5 px-1.5 py-1.5 hover:bg-stone-800/40">
              <button
                onClick={() => toggleAct(act.id)}
                className="p-0.5 text-stone-500 hover:text-stone-300 flex-shrink-0"
              >
                {collapsedActs.has(act.id)
                  ? <ChevronRight className="w-3 h-3" />
                  : <ChevronDown className="w-3 h-3" />}
              </button>
              <Layers className="w-3 h-3 text-stone-500 flex-shrink-0 ml-0.5" />

              {renamingId === `act-${act.id}` ? (
                <InlineRenameInput
                  initial={act.title}
                  onSave={(t) => renameAct(act.id, t)}
                  onCancel={() => setRenamingId(null)}
                />
              ) : (
                <span className="flex-1 text-xs font-medium text-stone-300 truncate ml-1">
                  {act.title}
                </span>
              )}

              <div className="opacity-0 group-hover:opacity-100 flex items-center ml-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 text-stone-500 hover:text-stone-200" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs w-40">
                    <DropdownMenuItem onClick={() => setRenamingId(`act-${act.id}`)}>
                      <Pencil className="w-3 h-3 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addNode('chapter', act.id)}>
                      <Plus className="w-3 h-3 mr-2" /> Add Chapter
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={() => deleteAct(act.id, act.title)}
                    >
                      <Trash2 className="w-3 h-3 mr-2" /> Delete Act
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {!collapsedActs.has(act.id) && act.chapters.map((chapter) => (
              <div key={chapter.id}>
                {/* Chapter row */}
                <div className="group flex items-center gap-0.5 pl-5 pr-1.5 py-1.5 hover:bg-stone-800/40">
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="p-0.5 text-stone-600 hover:text-stone-400 flex-shrink-0"
                  >
                    {collapsedChapters.has(chapter.id)
                      ? <ChevronRight className="w-3 h-3" />
                      : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <FileText className="w-3 h-3 text-stone-500 flex-shrink-0 ml-0.5" />

                  {renamingId === `chapter-${chapter.id}` ? (
                    <InlineRenameInput
                      initial={chapter.title}
                      onSave={(t) => renameChapter(chapter.id, t)}
                      onCancel={() => setRenamingId(null)}
                    />
                  ) : (
                    <span className="flex-1 text-xs text-stone-400 truncate ml-1">
                      {chapter.title}
                    </span>
                  )}

                  <div className="opacity-0 group-hover:opacity-100 flex items-center ml-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-stone-600 hover:text-stone-300" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs w-40">
                        <DropdownMenuItem onClick={() => setRenamingId(`chapter-${chapter.id}`)}>
                          <Pencil className="w-3 h-3 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => addNode('scene', chapter.id)}>
                          <Plus className="w-3 h-3 mr-2" /> Add Scene
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={() => deleteChapter(chapter.id, chapter.title, chapter.scenes.length)}
                        >
                          <Trash2 className="w-3 h-3 mr-2" /> Delete Chapter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {!collapsedChapters.has(chapter.id) && chapter.scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={`group flex items-center gap-1.5 pl-10 pr-1.5 py-1.5 cursor-pointer transition-colors ${
                      selectedSceneId === scene.id
                        ? 'bg-stone-700/70 text-stone-100'
                        : 'hover:bg-stone-800/40 text-stone-400 hover:text-stone-200'
                    }`}
                    onClick={() => onSelectScene(scene.id)}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLOR[scene.status] ?? 'bg-stone-500'}`} />

                    {renamingId === `scene-${scene.id}` ? (
                      <InlineRenameInput
                        initial={scene.title}
                        onSave={(t) => renameScene(scene.id, t)}
                        onCancel={() => setRenamingId(null)}
                      />
                    ) : (
                      <span className="flex-1 text-xs truncate">{scene.title}</span>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-500 hover:text-stone-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-xs w-40">
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setRenamingId(`scene-${scene.id}`); }}
                        >
                          <Pencil className="w-3 h-3 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={(e) => { e.stopPropagation(); deleteScene(scene.id, scene.title); }}
                        >
                          <Trash2 className="w-3 h-3 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-stone-700/50">
        <Button
          size="sm" variant="ghost"
          className="w-full justify-start text-stone-400 hover:text-stone-200 hover:bg-stone-800 text-xs h-7"
          onClick={() => addNode('act')}
        >
          <Plus className="w-3 h-3 mr-2" />
          New Act
        </Button>
      </div>
    </div>
  );
}
