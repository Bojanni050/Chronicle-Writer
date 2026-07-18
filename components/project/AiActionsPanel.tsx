'use client';

import { useState } from 'react';
import { Scene, BrainstormResult, RewriteResult, ContinuityCheckResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb, PenLine, RefreshCcw, ShieldCheck, Loader2,
  ChevronDown, ChevronUp, Copy, Check, ArrowDownToLine, AlertTriangle,
} from 'lucide-react';

interface AiActionsPanelProps {
  projectId: string;
  sceneId: string;
  scene: Scene | null;
  onInsertContent?: (text: string) => void;
}

type TaskType = 'brainstorm' | 'draft' | 'rewrite' | 'continuity_check';

interface RunResult {
  id: string;
  task_type: TaskType;
  output_text: string;
  provider: string;
  model: string;
  latency_ms: number | null;
  token_usage_json: { inputTokens?: number; outputTokens?: number } | null;
  parsedOutput: BrainstormResult | RewriteResult | ContinuityCheckResult | null;
}

const TASKS: Array<{
  type: TaskType;
  label: string;
  icon: React.ReactNode;
  description: string;
  endpoint: string;
}> = [
  { type: 'brainstorm', label: 'Brainstorm', icon: <Lightbulb className="w-3.5 h-3.5" />, description: 'Generate creative directions for this scene.', endpoint: 'brainstorm' },
  { type: 'draft', label: 'Scene Draft', icon: <PenLine className="w-3.5 h-3.5" />, description: 'Write a first draft based on the scene brief.', endpoint: 'draft' },
  { type: 'rewrite', label: 'Rewrite', icon: <RefreshCcw className="w-3.5 h-3.5" />, description: 'Improve pacing, clarity, and voice.', endpoint: 'rewrite' },
  { type: 'continuity_check', label: 'Continuity Check', icon: <ShieldCheck className="w-3.5 h-3.5" />, description: 'Check for continuity issues against the story bible.', endpoint: 'continuity-check' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy} className="p-1 text-stone-400 hover:text-stone-600 transition-colors" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function BrainstormResultView({ result, onInsert }: { result: BrainstormResult; onInsert?: (t: string) => void }) {
  return (
    <div className="space-y-2">
      {result.suggestions.map((s, i) => (
        <div key={i} className="p-2.5 rounded-md bg-stone-50 border border-stone-100">
          <p className="text-xs font-medium text-stone-700 mb-0.5">{s.title}</p>
          <p className="text-[11px] text-stone-500 leading-relaxed">{s.description}</p>
          {onInsert && (
            <button onClick={() => onInsert(s.description)} className="mt-1 text-[10px] text-blue-500 hover:underline flex items-center gap-1">
              <ArrowDownToLine className="w-3 h-3" /> Insert
            </button>
          )}
        </div>
      ))}
      {result.recommendedDirection && (
        <div className="p-2 rounded-md bg-amber-50 border border-amber-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 mb-0.5">Recommended Direction</p>
          <p className="text-[11px] text-stone-600">{result.recommendedDirection}</p>
        </div>
      )}
      {result.risks && result.risks.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">Risks</p>
          <ul className="space-y-0.5">
            {result.risks.map((r, i) => (
              <li key={i} className="text-[11px] text-stone-500 flex items-start gap-1.5"><span className="text-amber-400 mt-0.5">•</span>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DraftResultView({ text, onInsert }: { text: string; onInsert?: (t: string) => void }) {
  return (
    <div>
      <pre className="text-[11px] text-stone-700 whitespace-pre-wrap font-['Georgia',_serif] leading-relaxed bg-stone-50 p-3 rounded-md border border-stone-100">{text}</pre>
      {onInsert && (
        <button onClick={() => onInsert(text)} className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
          <ArrowDownToLine className="w-3.5 h-3.5" /> Insert into editor
        </button>
      )}
    </div>
  );
}

function RewriteResultView({ result, onInsert }: { result: RewriteResult; onInsert?: (t: string) => void }) {
  return (
    <div className="space-y-2">
      <pre className="text-[11px] text-stone-700 whitespace-pre-wrap font-['Georgia',_serif] leading-relaxed bg-stone-50 p-3 rounded-md border border-stone-100">{result.rewrittenText}</pre>
      {result.notes && <p className="text-[11px] text-stone-400 italic">{result.notes}</p>}
      {onInsert && (
        <button onClick={() => onInsert(result.rewrittenText)} className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
          <ArrowDownToLine className="w-3.5 h-3.5" /> Replace editor content
        </button>
      )}
    </div>
  );
}

function ContinuityResultView({ result }: { result: ContinuityCheckResult }) {
  const STATUS_COLOR = {
    clean: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    minor_issues: 'text-amber-600 bg-amber-50 border-amber-200',
    major_issues: 'text-red-600 bg-red-50 border-red-200',
  };
  const STATUS_LABEL = { clean: 'Clean', minor_issues: 'Minor Issues', major_issues: 'Major Issues' };
  const SEVERITY_COLOR = { low: 'text-stone-500', medium: 'text-amber-600', high: 'text-red-500' };

  return (
    <div className="space-y-2">
      <div className={`px-2.5 py-1.5 rounded-md border text-xs font-medium ${STATUS_COLOR[result.overallStatus]}`}>
        {STATUS_LABEL[result.overallStatus]}
        {result.summary && <span className="font-normal ml-1">— {result.summary}</span>}
      </div>
      {result.issues.length === 0 ? (
        <p className="text-[11px] text-stone-400">No continuity issues found.</p>
      ) : (
        <div className="space-y-2">
          {result.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-stone-50 border border-stone-100">
              <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${SEVERITY_COLOR[issue.severity]}`} />
              <div className="min-w-0">
                <p className="text-[11px] text-stone-700 leading-relaxed">{issue.description}</p>
                {issue.relatedEntities && issue.relatedEntities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {issue.relatedEntities.map((e, j) => (
                      <span key={j} className="text-[9px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded-full">{e}</span>
                    ))}
                  </div>
                )}
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${SEVERITY_COLOR[issue.severity]}`}>{issue.severity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ result, onInsert }: { result: RunResult; onInsert?: (t: string) => void }) {
  const [open, setOpen] = useState(true);

  const textForCopy =
    result.task_type === 'rewrite' && result.parsedOutput
      ? (result.parsedOutput as RewriteResult).rewrittenText
      : result.output_text;

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
      >
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 capitalize flex-shrink-0">
          {result.task_type.replace('_', ' ')}
        </Badge>
        <span className="flex-1 text-[11px] text-stone-400 truncate">
          {result.provider} · {result.model}
          {result.latency_ms != null && ` · ${(result.latency_ms / 1000).toFixed(1)}s`}
          {result.token_usage_json?.outputTokens != null && ` · ${result.token_usage_json.outputTokens} tok`}
        </span>
        <CopyButton text={textForCopy} />
        {open ? <ChevronUp className="w-3 h-3 text-stone-400" /> : <ChevronDown className="w-3 h-3 text-stone-400" />}
      </button>

      {open && (
        <div className="px-3 py-2.5 bg-white">
          {result.task_type === 'brainstorm' && result.parsedOutput ? (
            <BrainstormResultView result={result.parsedOutput as BrainstormResult} onInsert={onInsert} />
          ) : result.task_type === 'draft' ? (
            <DraftResultView text={result.output_text} onInsert={onInsert} />
          ) : result.task_type === 'rewrite' && result.parsedOutput ? (
            <RewriteResultView result={result.parsedOutput as RewriteResult} onInsert={onInsert} />
          ) : result.task_type === 'continuity_check' && result.parsedOutput ? (
            <ContinuityResultView result={result.parsedOutput as ContinuityCheckResult} />
          ) : (
            <pre className="text-[11px] text-stone-600 whitespace-pre-wrap font-sans leading-relaxed">{result.output_text}</pre>
          )}
        </div>
      )}
    </div>
  );
}

export function AiActionsPanel({ projectId, sceneId, scene, onInsertContent }: AiActionsPanelProps) {
  const [activeTask, setActiveTask] = useState<TaskType | null>(null);
  const [instruction, setInstruction] = useState('');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RunResult[]>([]);

  async function runTask(task: typeof TASKS[0]) {
    setRunning(true);
    setError(null);

    const res = await fetch(`/api/projects/${projectId}/scenes/${sceneId}/${task.endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInstruction: instruction.trim() || undefined }),
    });

    setRunning(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Request failed' }));
      setError(body.error ?? 'Unknown error');
      return;
    }

    const run: RunResult = await res.json();
    setResults((prev) => [run, ...prev]);
    setInstruction('');
    setActiveTask(null);
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">AI Actions</h3>

      <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        Set <code className="font-mono">AI_PROVIDER</code> to <code className="font-mono">openai</code>, <code className="font-mono">anthropic</code>, or <code className="font-mono">ollama</code> to use a real model. Currently in stub mode.
      </div>

      {error && (
        <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
      )}

      <div className="space-y-2">
        {TASKS.map((task) => (
          <div key={task.type}>
            <button
              onClick={() => setActiveTask(activeTask === task.type ? null : task.type)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                activeTask === task.type
                  ? 'border-stone-900 bg-stone-900 text-white'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 text-stone-700'
              }`}
            >
              <span className="flex-shrink-0">{task.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{task.label}</p>
                <p className={`text-[11px] ${activeTask === task.type ? 'text-stone-300' : 'text-stone-400'}`}>{task.description}</p>
              </div>
            </button>

            {activeTask === task.type && (
              <div className="mt-1.5 space-y-1.5">
                <Textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Optional: extra instructions…"
                  className="text-xs resize-none min-h-[56px] border-stone-200"
                  rows={2}
                />
                <Button size="sm" className="w-full h-7 text-xs" onClick={() => runTask(task)} disabled={running}>
                  {running ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Running…</> : `Run ${task.label}`}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Results</p>
          {results.map((r) => <ResultCard key={r.id} result={r} onInsert={onInsertContent} />)}
        </div>
      )}
    </div>
  );
}
