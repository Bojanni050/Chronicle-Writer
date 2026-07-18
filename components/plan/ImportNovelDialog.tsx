'use client';

import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Upload, X, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface DetectedChapter {
  title: string;
  summary: string;
}

interface ImportNovelDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (chapters: DetectedChapter[]) => Promise<void>;
}

type ParseStatus = 'idle' | 'parsing' | 'done' | 'error';

function parseText(text: string): DetectedChapter[] {
  const lines = text.split('\n');
  const chapterRegex = /^(chapter\s+(\w+)|act\s+\w+|part\s+\w+|\*\*\*+|---+)/i;
  const chapters: DetectedChapter[] = [];
  let current: { title: string; lines: string[] } | null = null;

  function flush() {
    if (!current) return;
    const contentLines = current.lines.filter(l => l.trim().length > 0);
    const summaryWords = contentLines.slice(0, 5).join(' ').slice(0, 200);
    chapters.push({ title: current.title, summary: summaryWords ? `${summaryWords}…` : '' });
    current = null;
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (chapterRegex.test(line)) {
      flush();
      const separator = /^\*{3,}|^-{3,}/.test(line);
      current = { title: separator ? `Section ${chapters.length + 1}` : line, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();

  // Fallback: if no markers found, split by blank line runs
  if (chapters.length === 0) {
    const paragraphs = text.split(/\n{3,}/).filter((p) => p.trim().length > 0);
    return paragraphs.slice(0, 20).map((p, i) => ({
      title: `Section ${i + 1}`,
      summary: p.trim().slice(0, 200) + (p.length > 200 ? '…' : ''),
    }));
  }

  return chapters;
}

export function ImportNovelDialog({ open, onOpenChange, onConfirm }: ImportNovelDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ParseStatus>('idle');
  const [fileName, setFileName] = useState('');
  const [detected, setDetected] = useState<DetectedChapter[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirming, setConfirming] = useState(false);

  async function handleFile(file: File) {
    setStatus('parsing');
    setFileName(file.name);
    setErrorMsg('');

    try {
      let text = '';
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'txt') {
        text = await file.text();
      } else if (ext === 'docx') {
        // DOCX is a ZIP with XML inside. Extract word/document.xml via arraybuffer + regex.
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        // Find the word/document.xml content
        const header = Array.from(bytes.slice(0, 4));
        const str = String.fromCharCode(...header);
        if (str !== 'PK\x03\x04') {
          throw new Error('Invalid DOCX file format.');
        }
        // Simple extraction: convert to text and strip XML tags
        const raw = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
        const xmlMatch = raw.match(/<w:body>([\s\S]*?)<\/w:body>/);
        if (!xmlMatch) throw new Error('Could not find document content in DOCX.');
        text = xmlMatch[1]
          .replace(/<w:br[^>]*\/>/g, '\n')
          .replace(/<w:p[ >]/g, '\n')
          .replace(/<\/w:p>/g, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x[0-9A-Fa-f]+;/g, ' ');
      } else {
        throw new Error('Unsupported file type. Please upload a .txt or .docx file.');
      }

      if (!text.trim()) throw new Error('File appears to be empty.');

      const chapters = parseText(text);
      if (chapters.length === 0) throw new Error('No chapters or sections detected in this file.');

      setDetected(chapters);
      setStatus('done');
    } catch (err) {
      setErrorMsg((err as Error).message);
      setStatus('error');
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    await onConfirm(detected);
    setConfirming(false);
    onOpenChange(false);
    reset();
  }

  function reset() {
    setStatus('idle');
    setFileName('');
    setDetected([]);
    setErrorMsg('');
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 flex-shrink-0">
            <div>
              <Dialog.Title className="text-base font-semibold text-stone-800">Import Novel</Dialog.Title>
              <Dialog.Description className="text-xs text-stone-400 mt-0.5">
                Upload a TXT or DOCX file to auto-detect chapters and generate an outline.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {status === 'idle' && (
              <label
                className="flex flex-col items-center justify-center gap-4 border-2 border-dashed border-stone-300 rounded-xl p-12 cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-colors"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-stone-300" />
                <div className="text-center">
                  <p className="text-sm font-medium text-stone-600">Click to choose a file</p>
                  <p className="text-xs text-stone-400 mt-1">Supports .txt and .docx files</p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".txt,.docx"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </label>
            )}

            {status === 'parsing' && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
                <p className="text-sm text-stone-500">Analysing {fileName}…</p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Import failed</p>
                    <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={reset}>Try again</Button>
              </div>
            )}

            {status === 'done' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm text-emerald-700">
                    Detected <strong>{detected.length} chapter{detected.length !== 1 ? 's' : ''}</strong> in <strong>{fileName}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Preview</p>
                  <div className="border border-stone-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                    {detected.map((ch, i) => (
                      <div key={i} className={cn('px-4 py-3 border-b border-stone-100 last:border-0', i % 2 === 0 ? 'bg-white' : 'bg-stone-50')}>
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] text-stone-400 font-semibold w-5 flex-shrink-0 mt-0.5">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-stone-700 truncate">{ch.title}</p>
                            {ch.summary && <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-2">{ch.summary}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 flex-shrink-0 bg-stone-50">
            <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); reset(); }}>Cancel</Button>
            {status === 'done' && (
              <Button size="sm" onClick={handleConfirm} disabled={confirming}>
                {confirming ? 'Importing…' : `Import ${detected.length} Chapters`}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
