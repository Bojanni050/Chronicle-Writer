'use client';

import { useState, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { toast } from 'sonner';
import { OutlineTree } from './OutlineTree';
import { ChapterEditor } from './ChapterEditor';
import { PlanSceneEditor } from './PlanSceneEditor';
import { PlotView } from './PlotView';
import { TemplateSelector } from './TemplateSelector';
import { ImportNovelDialog, DetectedChapter } from './ImportNovelDialog';
import type { PlanChapter, PlanScene, PlotExpandedEntry, StoryTemplate } from '@/lib/plan-types';
import type { Project } from '@/lib/types';
import { Plus, LayoutTemplate, Upload, BarChart2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SelectionType = 'chapter' | 'scene' | 'plot' | null;

interface PlanPageProps {
  projectId: string;
  project: Project & {
    plan_template?: string | null;
    plot_summary_short?: string;
    plot_summary_expanded?: PlotExpandedEntry[];
  };
  initialChapters: PlanChapter[];
}

export function PlanPage({ projectId, project, initialChapters }: PlanPageProps) {
  const [chapters, setChapters] = useState<PlanChapter[]>(
    initialChapters.map((ch) => ({
      ...ch,
      scenes: (ch as any).plan_scenes ?? ch.scenes ?? [],
    }))
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<SelectionType>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const [templateOpen, setTemplateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // ── Selection ────────────────────────────────────────────────────────────────

  function handleSelect(id: string, type: 'chapter' | 'scene', chapterId?: string) {
    setSelectedId(id);
    setSelectedType(type);
    if (type === 'scene') setSelectedChapterId(chapterId ?? null);
  }

  // ── Chapter CRUD ─────────────────────────────────────────────────────────────

  async function addChapter(override?: Partial<PlanChapter>): Promise<PlanChapter | null> {
    const res = await fetch(`/api/projects/${projectId}/plan/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(override ?? {}),
    });
    if (!res.ok) { toast.error('Failed to add chapter'); return null; }
    const ch: PlanChapter = await res.json();
    const newCh = { ...ch, scenes: [] };
    setChapters((prev) => [...prev, newCh]);
    setSelectedId(ch.id);
    setSelectedType('chapter');
    return newCh;
  }

  async function updateChapter(id: string, data: Partial<PlanChapter>) {
    const res = await fetch(`/api/projects/${projectId}/plan/chapters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error('Failed to save chapter'); return; }
    const updated = await res.json();
    setChapters((prev) => prev.map((ch) => ch.id === id ? { ...ch, ...updated } : ch));
    toast.success('Chapter saved');
  }

  async function deleteChapter(id: string) {
    if (!confirm('Delete this chapter and all its scenes?')) return;
    await fetch(`/api/projects/${projectId}/plan/chapters/${id}`, { method: 'DELETE' });
    setChapters((prev) => prev.filter((ch) => ch.id !== id));
    if (selectedId === id) { setSelectedId(null); setSelectedType(null); }
    toast.success('Chapter deleted');
  }

  async function moveChapter(id: string, direction: 'up' | 'down') {
    const idx = chapters.findIndex((ch) => ch.id === id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= chapters.length) return;

    const next = chapters.map((ch, i) => {
      if (i === idx) return { ...ch, order_index: chapters[swapIdx].order_index };
      if (i === swapIdx) return { ...ch, order_index: chapters[idx].order_index };
      return ch;
    }).sort((a, b) => a.order_index - b.order_index);

    setChapters(next);

    await Promise.all([
      fetch(`/api/projects/${projectId}/plan/chapters/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_index: next.find(c => c.id === id)!.order_index }) }),
      fetch(`/api/projects/${projectId}/plan/chapters/${chapters[swapIdx].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_index: next.find(c => c.id === chapters[swapIdx].id)!.order_index }) }),
    ]);
  }

  // ── Scene CRUD ───────────────────────────────────────────────────────────────

  async function addScene(chapterId: string) {
    const res = await fetch(`/api/projects/${projectId}/plan/chapters/${chapterId}/scenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) { toast.error('Failed to add scene'); return; }
    const scene: PlanScene = await res.json();
    setChapters((prev) => prev.map((ch) =>
      ch.id === chapterId ? { ...ch, scenes: [...(ch.scenes ?? []), scene] } : ch
    ));
    setSelectedId(scene.id);
    setSelectedType('scene');
    setSelectedChapterId(chapterId);
  }

  async function updateScene(chapterId: string, sceneId: string, data: Partial<PlanScene>) {
    const res = await fetch(`/api/projects/${projectId}/plan/chapters/${chapterId}/scenes/${sceneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) { toast.error('Failed to save scene'); return; }
    const updated = await res.json();
    setChapters((prev) => prev.map((ch) =>
      ch.id === chapterId
        ? { ...ch, scenes: (ch.scenes ?? []).map((s) => s.id === sceneId ? { ...s, ...updated } : s) }
        : ch
    ));
    toast.success('Scene saved');
  }

  async function deleteScene(chapterId: string, sceneId: string) {
    if (!confirm('Delete this scene?')) return;
    await fetch(`/api/projects/${projectId}/plan/chapters/${chapterId}/scenes/${sceneId}`, { method: 'DELETE' });
    setChapters((prev) => prev.map((ch) =>
      ch.id === chapterId ? { ...ch, scenes: (ch.scenes ?? []).filter((s) => s.id !== sceneId) } : ch
    ));
    if (selectedId === sceneId) { setSelectedId(null); setSelectedType(null); }
    toast.success('Scene deleted');
  }

  async function moveScene(chapterId: string, sceneId: string, direction: 'up' | 'down') {
    const chapter = chapters.find((ch) => ch.id === chapterId);
    if (!chapter) return;
    const scenes = chapter.scenes ?? [];
    const idx = scenes.findIndex((s) => s.id === sceneId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= scenes.length) return;

    const nextScenes = scenes.map((s, i) => {
      if (i === idx) return { ...s, order_index: scenes[swapIdx].order_index };
      if (i === swapIdx) return { ...s, order_index: scenes[idx].order_index };
      return s;
    }).sort((a, b) => a.order_index - b.order_index);

    setChapters((prev) => prev.map((ch) => ch.id === chapterId ? { ...ch, scenes: nextScenes } : ch));

    await Promise.all([
      fetch(`/api/projects/${projectId}/plan/chapters/${chapterId}/scenes/${sceneId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_index: nextScenes.find(s => s.id === sceneId)!.order_index }) }),
      fetch(`/api/projects/${projectId}/plan/chapters/${chapterId}/scenes/${scenes[swapIdx].id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_index: nextScenes.find(s => s.id === scenes[swapIdx].id)!.order_index }) }),
    ]);
  }

  // ── Template ─────────────────────────────────────────────────────────────────

  async function applyTemplate(template: StoryTemplate) {
    // Delete all existing chapters (cascade deletes scenes)
    for (const ch of chapters) {
      await fetch(`/api/projects/${projectId}/plan/chapters/${ch.id}`, { method: 'DELETE' });
    }
    setChapters([]);

    // Create chapters from template stages
    const created: PlanChapter[] = [];
    for (let i = 0; i < template.stages.length; i++) {
      const stage = template.stages[i];
      const res = await fetch(`/api/projects/${projectId}/plan/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: stage.title, summary: stage.summary, order_index: i }),
      });
      if (res.ok) {
        const ch = await res.json();
        created.push({ ...ch, scenes: [] });
      }
    }
    setChapters(created);

    // Save selected template
    await fetch(`/api/projects/${projectId}/plan/plot`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_template: template.id }),
    });

    setSelectedId(null);
    setSelectedType(null);
    toast.success(`Applied "${template.name}" template — ${created.length} chapters created`);
  }

  // ── Import ───────────────────────────────────────────────────────────────────

  async function handleImport(detected: DetectedChapter[]) {
    for (const ch of chapters) {
      await fetch(`/api/projects/${projectId}/plan/chapters/${ch.id}`, { method: 'DELETE' });
    }
    setChapters([]);

    const created: PlanChapter[] = [];
    for (let i = 0; i < detected.length; i++) {
      const d = detected[i];
      const res = await fetch(`/api/projects/${projectId}/plan/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: d.title, summary: d.summary, order_index: i }),
      });
      if (res.ok) {
        const ch = await res.json();
        created.push({ ...ch, scenes: [] });
      }
    }
    setChapters(created);
    toast.success(`Imported ${created.length} chapters from file`);
  }

  // ── Plot ─────────────────────────────────────────────────────────────────────

  async function savePlotShort(text: string) {
    await fetch(`/api/projects/${projectId}/plan/plot`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plot_summary_short: text }),
    });
    toast.success('Synopsis saved');
  }

  async function savePlotExpanded(entries: PlotExpandedEntry[]) {
    await fetch(`/api/projects/${projectId}/plan/plot`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plot_summary_expanded: entries }),
    });
    toast.success('Breakdown saved');
  }

  // ── Derive selection ─────────────────────────────────────────────────────────

  const selectedChapter = chapters.find((ch) => ch.id === selectedId && selectedType === 'chapter') ?? null;
  const selectedScene = (() => {
    if (selectedType !== 'scene') return null;
    for (const ch of chapters) {
      const s = (ch.scenes ?? []).find((sc) => sc.id === selectedId);
      if (s) return s;
    }
    return null;
  })();

  const totalScenes = chapters.reduce((sum, ch) => sum + (ch.scenes?.length ?? 0), 0);

  return (
    <div className="h-screen flex flex-col bg-stone-50 overflow-hidden">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-stone-200 flex-shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-stone-800 truncate">{project.title}</h1>
            <p className="text-[10px] text-stone-400">{chapters.length} ch · {totalScenes} scenes</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ToolbarBtn icon={<Plus className="w-3.5 h-3.5" />} label="Chapter" onClick={() => addChapter()} />
          <ToolbarBtn icon={<LayoutTemplate className="w-3.5 h-3.5" />} label="Template" onClick={() => setTemplateOpen(true)} />
          <ToolbarBtn icon={<Upload className="w-3.5 h-3.5" />} label="Import" onClick={() => setImportOpen(true)} />
          <div className="w-px h-5 bg-stone-200 mx-1" />
          <ToolbarBtn
            icon={<BarChart2 className="w-3.5 h-3.5" />}
            label="Plot View"
            onClick={() => { setSelectedId('plot'); setSelectedType('plot'); }}
            active={selectedType === 'plot'}
          />
        </div>
      </header>

      {/* Panels */}
      <PanelGroup direction="horizontal" className="flex-1 min-h-0">
        <Panel defaultSize={28} minSize={20} maxSize={45}>
          <div className="h-full bg-white border-r border-stone-200 overflow-hidden">
            <OutlineTree
              projectId={projectId}
              chapters={chapters}
              selectedId={selectedId}
              selectedType={selectedType as 'chapter' | 'scene' | null}
              onSelect={handleSelect}
              onAddChapter={() => addChapter()}
              onAddScene={addScene}
              onDeleteChapter={deleteChapter}
              onDeleteScene={deleteScene}
              onMoveChapter={moveChapter}
              onMoveScene={moveScene}
            />
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-stone-200 hover:bg-stone-400 transition-colors cursor-col-resize flex items-center justify-center group">
          <GripVertical className="w-3 h-3 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </PanelResizeHandle>

        <Panel defaultSize={72} minSize={40}>
          <div className="h-full bg-white overflow-hidden">
            {selectedType === 'chapter' && selectedChapter && (
              <ChapterEditor
                key={selectedChapter.id}
                chapter={selectedChapter}
                onSave={(data) => updateChapter(selectedChapter.id, data)}
              />
            )}
            {selectedType === 'scene' && selectedScene && selectedChapterId && (
              <PlanSceneEditor
                key={selectedScene.id}
                scene={selectedScene}
                onSave={(data) => updateScene(selectedChapterId, selectedScene.id, data)}
              />
            )}
            {selectedType === 'plot' && (
              <PlotView
                key="plot"
                projectId={projectId}
                shortSummary={project.plot_summary_short ?? ''}
                expandedEntries={project.plot_summary_expanded ?? []}
                chapters={chapters}
                onSaveShort={savePlotShort}
                onSaveExpanded={savePlotExpanded}
              />
            )}
            {!selectedType && (
              <EmptyState
                chapterCount={chapters.length}
                onAddChapter={() => addChapter()}
                onTemplate={() => setTemplateOpen(true)}
                onPlot={() => { setSelectedId('plot'); setSelectedType('plot'); }}
              />
            )}
          </div>
        </Panel>
      </PanelGroup>

      <TemplateSelector
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        currentTemplateId={project.plan_template ?? null}
        onApply={applyTemplate}
      />

      <ImportNovelDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onConfirm={handleImport}
      />
    </div>
  );
}

function ToolbarBtn({
  icon, label, onClick, active = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
        active
          ? 'bg-stone-800 text-white'
          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-800'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState({
  chapterCount,
  onAddChapter,
  onTemplate,
  onPlot,
}: {
  chapterCount: number;
  onAddChapter: () => void;
  onTemplate: () => void;
  onPlot: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center">
        <BarChart2 className="w-8 h-8 text-stone-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-stone-700">
          {chapterCount === 0 ? 'Start planning your novel' : 'Select something to edit'}
        </h2>
        <p className="text-sm text-stone-400 mt-1 max-w-xs">
          {chapterCount === 0
            ? 'Add chapters manually, import an existing draft, or start with a story structure template.'
            : 'Click a chapter or scene in the outline to edit it, or view the Plot Summary.'}
        </p>
      </div>
      {chapterCount === 0 && (
        <div className="flex gap-2 flex-wrap justify-center">
          <Button size="sm" onClick={onAddChapter}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Chapter
          </Button>
          <Button size="sm" variant="outline" onClick={onTemplate}>
            <LayoutTemplate className="w-3.5 h-3.5 mr-1.5" /> Use Template
          </Button>
          <Button size="sm" variant="outline" onClick={onPlot}>
            <BarChart2 className="w-3.5 h-3.5 mr-1.5" /> Plot Summary
          </Button>
        </div>
      )}
    </div>
  );
}
