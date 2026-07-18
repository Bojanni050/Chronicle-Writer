'use client';

import { useState, useCallback } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PlanChapter, PlotExpandedEntry } from '@/lib/plan-types';
import { AlignLeft, LayoutList } from 'lucide-react';

interface PlotViewProps {
  projectId: string;
  shortSummary: string;
  expandedEntries: PlotExpandedEntry[];
  chapters: PlanChapter[];
  onSaveShort: (text: string) => Promise<void>;
  onSaveExpanded: (entries: PlotExpandedEntry[]) => Promise<void>;
}

export function PlotView({
  projectId,
  shortSummary,
  expandedEntries,
  chapters,
  onSaveShort,
  onSaveExpanded,
}: PlotViewProps) {
  const [shortText, setShortText] = useState(shortSummary);
  const [shortDirty, setShortDirty] = useState(false);
  const [shortSaving, setShortSaving] = useState(false);

  const [entries, setEntries] = useState<PlotExpandedEntry[]>(() => {
    return chapters.map((ch) => {
      const existing = expandedEntries.find((e) => e.chapterId === ch.id);
      return existing ?? { chapterId: ch.id, conflict: '', resolution: '', characterArcs: '' };
    });
  });
  const [expandedDirty, setExpandedDirty] = useState(false);
  const [expandedSaving, setExpandedSaving] = useState(false);

  async function saveShort() {
    setShortSaving(true);
    await onSaveShort(shortText);
    setShortDirty(false);
    setShortSaving(false);
  }

  async function saveExpanded() {
    setExpandedSaving(true);
    await onSaveExpanded(entries);
    setExpandedDirty(false);
    setExpandedSaving(false);
  }

  function updateEntry(chapterId: string, field: keyof PlotExpandedEntry, value: string) {
    setEntries((prev) =>
      prev.map((e) => e.chapterId === chapterId ? { ...e, [field]: value } : e)
    );
    setExpandedDirty(true);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-stone-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-stone-800">Plot Summary</h2>
        <p className="text-xs text-stone-400 mt-0.5">Overview of your story's structure and arc</p>
      </div>

      <Tabs.Root defaultValue="short" className="flex flex-col flex-1 min-h-0">
        <Tabs.List className="flex border-b border-stone-200 px-6 flex-shrink-0">
          <Tabs.Trigger
            value="short"
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-stone-500 border-b-2 border-transparent data-[state=active]:border-stone-800 data-[state=active]:text-stone-800 transition-colors"
          >
            <AlignLeft className="w-3.5 h-3.5" />
            Short Synopsis
          </Tabs.Trigger>
          <Tabs.Trigger
            value="expanded"
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-stone-500 border-b-2 border-transparent data-[state=active]:border-stone-800 data-[state=active]:text-stone-800 transition-colors"
          >
            <LayoutList className="w-3.5 h-3.5" />
            Expanded Breakdown
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="short" className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-xs text-stone-500 mb-3">
            A one-to-two paragraph synopsis of your novel. This is the version you'd pitch to an agent or put on a query letter.
          </p>
          <Textarea
            value={shortText}
            onChange={(e) => { setShortText(e.target.value); setShortDirty(true); }}
            rows={12}
            className="text-sm resize-none w-full"
            placeholder="In a world where maps reshape reality, cartographer Mara Voss discovers she has been unknowingly erasing towns with her pencil…"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-stone-400">
              {shortText.split(/\s+/).filter(Boolean).length} words
              {shortDirty && ' · Unsaved changes'}
            </p>
            <Button size="sm" onClick={saveShort} disabled={!shortDirty || shortSaving}>
              {shortSaving ? 'Saving…' : 'Save Synopsis'}
            </Button>
          </div>
        </Tabs.Content>

        <Tabs.Content value="expanded" className="flex-1 overflow-y-auto px-6 py-5">
          {chapters.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <LayoutList className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Add chapters to build the expanded breakdown.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {chapters.map((ch, i) => {
                const entry = entries.find((e) => e.chapterId === ch.id) ?? { chapterId: ch.id, conflict: '', resolution: '', characterArcs: '' };
                return (
                  <div key={ch.id} className="border border-stone-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-stone-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <h3 className="font-medium text-sm text-stone-800">{ch.title || 'Untitled Chapter'}</h3>
                      {ch.pov_character && (
                        <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">POV: {ch.pov_character}</span>
                      )}
                    </div>
                    {ch.summary && <p className="text-xs text-stone-500 italic border-l-2 border-stone-200 pl-3">{ch.summary}</p>}
                    <div className="grid grid-cols-1 gap-3">
                      <EntryField
                        label="Conflict"
                        value={entry.conflict}
                        placeholder="What is the central conflict or challenge in this chapter?"
                        onChange={(v) => updateEntry(ch.id, 'conflict', v)}
                      />
                      <EntryField
                        label="Resolution"
                        value={entry.resolution}
                        placeholder="How is the conflict resolved (or left unresolved)? What changes?"
                        onChange={(v) => updateEntry(ch.id, 'resolution', v)}
                      />
                      <EntryField
                        label="Character Arcs"
                        value={entry.characterArcs}
                        placeholder="How do characters develop, change, or reveal themselves in this chapter?"
                        onChange={(v) => updateEntry(ch.id, 'characterArcs', v)}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end pb-4">
                <Button size="sm" onClick={saveExpanded} disabled={!expandedDirty || expandedSaving}>
                  {expandedSaving ? 'Saving…' : 'Save Breakdown'}
                </Button>
              </div>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function EntryField({
  label, value, placeholder, onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="text-xs resize-none"
        placeholder={placeholder}
      />
    </div>
  );
}
