'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Scene, SceneVersion } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Save, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface SceneEditorProps {
  projectId: string;
  sceneId: string;
  /** Text to insert/replace into the editor from the AI panel. */
  insertRequest?: string | null;
  onInsertConsumed?: () => void;
}

type SaveState = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';
const STATUS_OPTIONS = ['draft', 'written', 'revised', 'final'] as const;

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export function SceneEditor({ projectId, sceneId, insertRequest, onInsertConsumed }: SceneEditorProps) {
  const [scene, setScene] = useState<Scene | null>(null);

  // Brief fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [pov, setPov] = useState('');
  const [goal, setGoal] = useState('');
  const [conflict, setConflict] = useState('');
  const [emotion, setEmotion] = useState('');
  const [status, setStatus] = useState<string>('draft');
  const [briefOpen, setBriefOpen] = useState(false);

  // Content
  const [content, setContent] = useState('');

  // Save state
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Versions
  const [versions, setVersions] = useState<Array<{ id: string; word_count: number; created_at: string }>>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<SceneVersion | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(false);

  // Consume an insert request from the AI panel by appending to content.
  useEffect(() => {
    if (!insertRequest) return;
    setContent((prev) => (prev ? `${prev}\n\n${insertRequest}` : insertRequest));
    onInsertConsumed?.();
  }, [insertRequest]);

  // Load scene
  useEffect(() => {
    initialLoadRef.current = false;
    setSaveState('idle');
    async function load() {
      const res = await fetch(`/api/projects/${projectId}/scenes/${sceneId}`);
      if (!res.ok) return;
      const data: Scene = await res.json();
      setScene(data);
      setTitle(data.title);
      setSummary(data.summary);
      setPov(data.pov);
      setGoal(data.goal);
      setConflict(data.conflict);
      setEmotion(data.emotion);
      setStatus(data.status);
      setContent(data.content_md);
      initialLoadRef.current = true;
    }
    load();
  }, [projectId, sceneId]);

  const save = useCallback(
    async (fields: {
      title: string; summary: string; pov: string; goal: string;
      conflict: string; emotion: string; status: string; content_md: string;
    }) => {
      setSaveState('saving');
      const res = await fetch(`/api/projects/${projectId}/scenes/${sceneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        setSaveState('saved');
        setLastSaved(new Date());
        setTimeout(() => setSaveState('idle'), 2500);
      } else {
        setSaveState('error');
      }
    },
    [projectId, sceneId]
  );

  // Debounced autosave — triggers on any field change
  useEffect(() => {
    if (!initialLoadRef.current) return;
    setSaveState('unsaved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      save({ title, summary, pov, goal, conflict, emotion, status, content_md: content });
    }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title, summary, pov, goal, conflict, emotion, status, content, save]);

  async function loadVersions() {
    const res = await fetch(`/api/projects/${projectId}/scenes/${sceneId}/versions`);
    if (res.ok) setVersions(await res.json());
    setShowVersions((v) => !v);
  }

  async function openVersionPreview(versionId: string) {
    const res = await fetch(`/api/projects/${projectId}/scenes/${sceneId}/versions/${versionId}`);
    if (res.ok) setPreviewVersion(await res.json());
  }

  function restoreVersion(versionContent: string) {
    setContent(versionContent);
    setPreviewVersion(null);
  }

  if (!scene) {
    return (
      <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
        Loading…
      </div>
    );
  }

  const wordCount = countWords(content);

  return (
    <div className="flex flex-col h-full">
      {/* Title row */}
      <div className="flex items-center gap-3 px-8 pt-8 pb-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 text-2xl font-semibold text-stone-900 bg-transparent border-none outline-none placeholder:text-stone-300 min-w-0"
          placeholder="Scene title…"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-24 h-7 text-xs border-stone-200 flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Collapsible brief section */}
      <div className="border-y border-stone-100">
        <button
          onClick={() => setBriefOpen((o) => !o)}
          className="w-full flex items-center gap-2 px-8 py-2 text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
        >
          {briefOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span className="font-medium">Scene Brief</span>
          {(pov || goal || conflict || emotion || summary) && (
            <span className="ml-1 text-stone-300">·</span>
          )}
          {!briefOpen && pov && <span className="text-stone-400 truncate max-w-[120px]">POV: {pov}</span>}
          {!briefOpen && goal && <span className="text-stone-400 truncate max-w-[140px] hidden sm:inline">Goal: {goal}</span>}
        </button>

        {briefOpen && (
          <div className="px-8 pb-4 pt-1 space-y-3 bg-stone-50/60">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="One-paragraph summary of this scene…"
                rows={2}
                className="w-full text-xs text-stone-700 bg-white border border-stone-200 rounded-md px-3 py-2 resize-none outline-none focus:ring-1 focus:ring-stone-300 placeholder:text-stone-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'POV Character', value: pov, set: setPov, placeholder: 'e.g. Elena' },
                { label: 'Scene Goal', value: goal, set: setGoal, placeholder: 'What does POV want?' },
                { label: 'Conflict', value: conflict, set: setConflict, placeholder: 'What blocks them?' },
                { label: 'Emotion / Tone', value: emotion, set: setEmotion, placeholder: 'e.g. dread, hope' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                    {label}
                  </label>
                  <input
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-7 text-xs text-stone-700 bg-white border border-stone-200 rounded-md px-3 outline-none focus:ring-1 focus:ring-stone-300 placeholder:text-stone-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content editor */}
      <div className="flex-1 overflow-y-auto px-8 py-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full min-h-[400px] resize-none bg-transparent border-none outline-none text-stone-800 text-[15px] leading-[1.75] font-['Georgia',_serif] placeholder:text-stone-300"
          placeholder={"Begin writing your scene…\n\nMarkdown supported: # headings, **bold**, _italic_, - lists."}
          spellCheck
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-8 py-2.5 border-t border-stone-100 text-xs text-stone-400 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>{wordCount.toLocaleString()} words</span>
          <button
            onClick={loadVersions}
            className="flex items-center gap-1 hover:text-stone-600 transition-colors"
          >
            <Clock className="w-3 h-3" />
            {showVersions ? 'Hide versions' : 'Versions'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {saveState === 'unsaved' && <span className="text-stone-400">Unsaved changes</span>}
          {saveState === 'saving' && (
            <span className="flex items-center gap-1 text-amber-500">
              <Save className="w-3 h-3 animate-pulse" /> Saving…
            </span>
          )}
          {saveState === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-500">
              <Save className="w-3 h-3" /> Saved
            </span>
          )}
          {saveState === 'error' && <span className="text-red-500">Save failed</span>}
          {lastSaved && saveState === 'idle' && (
            <span>Saved {format(lastSaved, 'HH:mm')}</span>
          )}
        </div>
      </div>

      {/* Version history drawer */}
      {showVersions && (
        <div className="border-t border-stone-100 bg-stone-50 max-h-44 overflow-y-auto flex-shrink-0">
          <div className="sticky top-0 flex items-center justify-between px-8 py-2 bg-stone-100 border-b border-stone-200">
            <span className="text-xs font-medium text-stone-600">Version History</span>
            <span className="text-[11px] text-stone-400">Click to preview · restore available in preview</span>
          </div>
          {versions.length === 0 ? (
            <p className="px-8 py-3 text-xs text-stone-400">
              No versions yet. Versions are saved when content changes.
            </p>
          ) : (
            <ul>
              {versions.map((v, i) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between px-8 py-2 text-xs text-stone-500 hover:bg-white cursor-pointer transition-colors border-b border-stone-100 last:border-0"
                  onClick={() => openVersionPreview(v.id)}
                >
                  <span className="flex items-center gap-2">
                    {i === 0 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium">
                        latest
                      </span>
                    )}
                    {format(new Date(v.created_at), 'dd MMM yyyy, HH:mm')}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    {v.word_count.toLocaleString()} words
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Version preview dialog */}
      <Dialog open={!!previewVersion} onOpenChange={(o) => { if (!o) setPreviewVersion(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-sm">
              Version from{' '}
              {previewVersion && format(new Date(previewVersion.created_at), 'dd MMM yyyy, HH:mm')}
              {previewVersion && (
                <Badge variant="secondary" className="text-[10px]">
                  {previewVersion.word_count.toLocaleString()} words
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <pre className="text-sm text-stone-700 whitespace-pre-wrap font-['Georgia',_serif] leading-relaxed p-1">
              {previewVersion?.content_md || '(empty)'}
            </pre>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-400">
              Restoring will replace the current editor content and autosave.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => previewVersion && restoreVersion(previewVersion.content_md)}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore this version
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
