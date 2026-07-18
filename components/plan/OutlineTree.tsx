'use client';

import { useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import {
  ChevronRight, ChevronDown, Plus, Trash2, ArrowUp, ArrowDown,
  BookOpen, FileText, Circle, ArrowLeft
} from 'lucide-react';
import type { PlanChapter, PlanScene } from '@/lib/plan-types';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  planned:  'text-amber-500',
  draft:    'text-blue-500',
  complete: 'text-emerald-500',
};

const PURPOSE_COLORS: Record<string, string> = {
  plot:             'bg-violet-100 text-violet-700',
  character:        'bg-rose-100 text-rose-700',
  'world-building': 'bg-teal-100 text-teal-700',
};

interface OutlineTreeProps {
  projectId: string;
  chapters: PlanChapter[];
  selectedId: string | null;
  selectedType: 'chapter' | 'scene' | null;
  onSelect: (id: string, type: 'chapter' | 'scene', chapterId?: string) => void;
  onAddChapter: () => void;
  onAddScene: (chapterId: string) => void;
  onDeleteChapter: (id: string) => void;
  onDeleteScene: (chapterId: string, sceneId: string) => void;
  onMoveChapter: (id: string, direction: 'up' | 'down') => void;
  onMoveScene: (chapterId: string, sceneId: string, direction: 'up' | 'down') => void;
}

export function OutlineTree({
  projectId,
  chapters,
  selectedId,
  selectedType,
  onSelect,
  onAddChapter,
  onAddScene,
  onDeleteChapter,
  onDeleteScene,
  onMoveChapter,
  onMoveScene,
}: OutlineTreeProps) {
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());

  function toggleChapter(id: string) {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back link */}
      <a
        href={`/projects/${projectId}`}
        className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] text-stone-500 bg-stone-800 hover:bg-stone-700 transition-colors flex-shrink-0"
      >
        <ArrowLeft className="w-3 h-3 text-stone-400" />
        <span className="text-stone-300">Back to Project</span>
      </a>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-stone-500" />
          <span className="text-sm font-semibold text-stone-700">Outline</span>
          <span className="text-xs text-stone-400">({chapters.length})</span>
        </div>
        <button
          onClick={onAddChapter}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 transition-colors px-2 py-1 rounded hover:bg-stone-100"
        >
          <Plus className="w-3 h-3" /> Chapter
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-stone-400 px-6 text-center">
            <BookOpen className="w-8 h-8 opacity-30" />
            <p className="text-sm">No chapters yet.</p>
            <button
              onClick={onAddChapter}
              className="text-xs text-stone-500 hover:text-stone-700 underline underline-offset-2"
            >
              Add your first chapter
            </button>
          </div>
        ) : (
          <div className="py-1">
            {chapters.map((chapter, ci) => {
              const isOpen = openChapters.has(chapter.id);
              const isChapterSelected = selectedId === chapter.id && selectedType === 'chapter';
              const scenes = chapter.scenes ?? [];

              return (
                <div key={chapter.id}>
                  {/* Chapter row */}
                  <div
                    className={cn(
                      'group flex items-center gap-1 px-2 py-1.5 cursor-pointer select-none',
                      isChapterSelected
                        ? 'bg-stone-800 text-white'
                        : 'hover:bg-stone-100 text-stone-700'
                    )}
                    onClick={() => onSelect(chapter.id, 'chapter')}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleChapter(chapter.id); }}
                      className={cn('flex-shrink-0 p-0.5 rounded transition-colors', isChapterSelected ? 'hover:bg-white/20' : 'hover:bg-stone-200')}
                    >
                      {isOpen
                        ? <ChevronDown className="w-3 h-3" />
                        : <ChevronRight className="w-3 h-3" />}
                    </button>

                    <Circle className={cn('w-2 h-2 flex-shrink-0 fill-current', isChapterSelected ? 'text-white/60' : STATUS_COLORS[chapter.status])} />

                    <span className="flex-1 min-w-0 text-xs font-medium truncate">
                      <span className={cn('mr-1.5', isChapterSelected ? 'text-white/50' : 'text-stone-400')}>
                        {ci + 1}.
                      </span>
                      {chapter.title || 'Untitled Chapter'}
                    </span>

                    {/* Actions */}
                    <div
                      className={cn('flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity', isChapterSelected && 'opacity-100')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActionBtn
                        icon={<ArrowUp className="w-2.5 h-2.5" />}
                        onClick={() => onMoveChapter(chapter.id, 'up')}
                        disabled={ci === 0}
                        light={isChapterSelected}
                      />
                      <ActionBtn
                        icon={<ArrowDown className="w-2.5 h-2.5" />}
                        onClick={() => onMoveChapter(chapter.id, 'down')}
                        disabled={ci === chapters.length - 1}
                        light={isChapterSelected}
                      />
                      <ActionBtn
                        icon={<Plus className="w-2.5 h-2.5" />}
                        onClick={() => { onAddScene(chapter.id); setOpenChapters((prev) => { const next = new Set(Array.from(prev)); next.add(chapter.id); return next; }); }}
                        light={isChapterSelected}
                      />
                      <ActionBtn
                        icon={<Trash2 className="w-2.5 h-2.5" />}
                        onClick={() => onDeleteChapter(chapter.id)}
                        danger
                        light={isChapterSelected}
                      />
                    </div>
                  </div>

                  {/* Scenes */}
                  {isOpen && (
                    <div className="pl-5">
                      {scenes.map((scene, si) => {
                        const isSceneSelected = selectedId === scene.id && selectedType === 'scene';
                        return (
                          <div
                            key={scene.id}
                            className={cn(
                              'group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer select-none border-l border-stone-200 ml-2',
                              isSceneSelected
                                ? 'bg-stone-700 text-white'
                                : 'hover:bg-stone-50 text-stone-600'
                            )}
                            onClick={() => onSelect(scene.id, 'scene', chapter.id)}
                          >
                            <FileText className="w-3 h-3 flex-shrink-0 opacity-50" />
                            <span className="flex-1 min-w-0 text-[11px] truncate">
                              {scene.title || 'Untitled Scene'}
                            </span>
                            <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0', PURPOSE_COLORS[scene.purpose])}>
                              {scene.purpose === 'world-building' ? 'WB' : scene.purpose.slice(0, 4)}
                            </span>
                            <div
                              className={cn('flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity', isSceneSelected && 'opacity-100')}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ActionBtn icon={<ArrowUp className="w-2.5 h-2.5" />} onClick={() => onMoveScene(chapter.id, scene.id, 'up')} disabled={si === 0} light={isSceneSelected} />
                              <ActionBtn icon={<ArrowDown className="w-2.5 h-2.5" />} onClick={() => onMoveScene(chapter.id, scene.id, 'down')} disabled={si === scenes.length - 1} light={isSceneSelected} />
                              <ActionBtn icon={<Trash2 className="w-2.5 h-2.5" />} onClick={() => onDeleteScene(chapter.id, scene.id)} danger light={isSceneSelected} />
                            </div>
                          </div>
                        );
                      })}
                      <button
                        onClick={() => onAddScene(chapter.id)}
                        className="flex items-center gap-1.5 px-2 py-1 ml-2 border-l border-stone-200 text-[11px] text-stone-400 hover:text-stone-600 w-full transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add scene
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon, onClick, disabled = false, danger = false, light = false,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  light?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-0.5 rounded transition-colors disabled:opacity-20',
        light
          ? danger ? 'text-white/70 hover:text-red-300' : 'text-white/70 hover:text-white'
          : danger ? 'text-stone-400 hover:text-red-500' : 'text-stone-400 hover:text-stone-700'
      )}
    >
      {icon}
    </button>
  );
}
