'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CheckCircle2, BookOpen } from 'lucide-react';
import { STORY_TEMPLATES } from '@/lib/story-templates';
import type { StoryTemplate } from '@/lib/plan-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currentTemplateId: string | null;
  onApply: (template: StoryTemplate) => Promise<void>;
}

export function TemplateSelector({ open, onOpenChange, currentTemplateId, onApply }: TemplateSelectorProps) {
  const [selected, setSelected] = useState<StoryTemplate | null>(null);
  const [preview, setPreview] = useState<StoryTemplate | null>(null);
  const [applying, setApplying] = useState(false);

  async function handleApply() {
    if (!selected) return;
    setApplying(true);
    await onApply(selected);
    setApplying(false);
    onOpenChange(false);
    setSelected(null);
    setPreview(null);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 flex-shrink-0">
            <div>
              <Dialog.Title className="text-base font-semibold text-stone-800">Story Structure Templates</Dialog.Title>
              <Dialog.Description className="text-xs text-stone-400 mt-0.5">
                Select a template to auto-populate your outline. Your current outline will be replaced.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Template list */}
            <div className="w-64 border-r border-stone-200 flex-shrink-0 overflow-y-auto py-2">
              {STORY_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelected(t); setPreview(t); }}
                  className={cn(
                    'w-full text-left px-4 py-3 transition-colors border-b border-stone-100 last:border-0',
                    selected?.id === t.id
                      ? 'bg-stone-800 text-white'
                      : 'hover:bg-stone-50 text-stone-700'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{t.name}</span>
                    {currentTemplateId === t.id && (
                      <CheckCircle2 className={cn('w-3.5 h-3.5 flex-shrink-0', selected?.id === t.id ? 'text-white/70' : 'text-emerald-500')} />
                    )}
                  </div>
                  <p className={cn('text-[11px] mt-0.5', selected?.id === t.id ? 'text-white/60' : 'text-stone-400')}>
                    {t.stages.length} stages
                  </p>
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto">
              {preview ? (
                <div className="px-6 py-5">
                  <h3 className="font-semibold text-stone-800 mb-1">{preview.name}</h3>
                  <p className="text-sm text-stone-500 mb-5">{preview.description}</p>
                  <div className="space-y-2">
                    {preview.stages.map((stage, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-stone-100 text-stone-500 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 pb-3 border-b border-stone-100 last:border-0">
                          <p className="text-sm font-medium text-stone-800">{stage.title}</p>
                          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{stage.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-stone-400">
                  <BookOpen className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Select a template to preview</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 flex-shrink-0 bg-stone-50">
            <p className="text-xs text-stone-500">
              {selected
                ? `"${selected.name}" — ${selected.stages.length} chapters will be created`
                : 'Choose a template from the list'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button size="sm" disabled={!selected || applying} onClick={handleApply}>
                {applying ? 'Applying…' : 'Apply Template'}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
