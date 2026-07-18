'use client';

import { useEffect, useState } from 'react';
import { ContextPack, RetrievedItem } from '@/lib/types';
import {
  ArrowLeft, ArrowRight, User, MapPin, Layers, FileText,
  BookOpen, Clock, RefreshCcw, Loader2, Search, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';

interface ContextPackPanelProps {
  projectId: string;
  sceneId: string | null;
}

const ENTITY_TYPE_LABEL: Record<string, string> = {
  scene: 'Scene', character: 'Character', location: 'Location',
  worldbuilding_note: 'Lore', timeline_event: 'Timeline', style_guide: 'Style',
};

const ENTITY_TYPE_COLOR: Record<string, string> = {
  scene: 'bg-sky-100 text-sky-700',
  character: 'bg-violet-100 text-violet-700',
  location: 'bg-emerald-100 text-emerald-700',
  worldbuilding_note: 'bg-amber-100 text-amber-700',
  timeline_event: 'bg-rose-100 text-rose-700',
  style_guide: 'bg-stone-100 text-stone-600',
};

export function ContextPackPanel({ projectId, sceneId }: ContextPackPanelProps) {
  const [pack, setPack] = useState<ContextPack | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!sceneId) return;
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/scenes/${sceneId}/context-pack`);
    if (res.ok) setPack(await res.json());
    setLoading(false);
  }

  useEffect(() => { setPack(null); load(); }, [projectId, sceneId]);

  if (!sceneId) {
    return (
      <div className="flex items-center justify-center h-24 text-xs text-stone-400">
        Select a scene to view context.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24 gap-2 text-xs text-stone-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading context…
      </div>
    );
  }

  if (!pack) return null;

  const { outlineContext, nearbyScenes, characters, locations, timelineEvents, styleGuide, retrievedItems, retrievalMeta } = pack;

  return (
    <div className="divide-y divide-stone-100">
      {outlineContext && (
        <Section title="Outline" icon={<Layers className="w-3.5 h-3.5" />}>
          <div className="px-3 py-2.5 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-stone-500">
              <span className="text-stone-400 font-medium">{outlineContext.actTitle}</span>
              <span className="text-stone-300">›</span>
              <span className="text-stone-500">{outlineContext.chapterTitle}</span>
            </div>
            <p className="text-stone-400 text-[11px]">
              Scene {outlineContext.sceneIndexInChapter + 1} of {outlineContext.sceneCountInChapter} in this chapter
            </p>
          </div>
        </Section>
      )}

      <Section title="Nearby Scenes" icon={<FileText className="w-3.5 h-3.5" />}>
        {!nearbyScenes.previous && !nearbyScenes.next ? (
          <p className="px-3 py-2 text-xs text-stone-400">No adjacent scenes.</p>
        ) : (
          <div className="px-3 py-2 space-y-2">
            {nearbyScenes.previous && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-stone-50 border border-stone-100">
                <ArrowLeft className="w-3 h-3 text-stone-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-0.5">Previous</p>
                  <p className="text-xs text-stone-600 font-medium truncate">{nearbyScenes.previous.title}</p>
                  {nearbyScenes.previous.summary && (
                    <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-2">{nearbyScenes.previous.summary}</p>
                  )}
                </div>
              </div>
            )}
            {nearbyScenes.next && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-stone-50 border border-stone-100">
                <ArrowRight className="w-3 h-3 text-stone-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-0.5">Next</p>
                  <p className="text-xs text-stone-600 font-medium truncate">{nearbyScenes.next.title}</p>
                  {nearbyScenes.next.summary && (
                    <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-2">{nearbyScenes.next.summary}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title={`Characters (${characters.length})`} icon={<User className="w-3.5 h-3.5" />} defaultOpen={false}>
        {characters.length === 0 ? (
          <p className="px-3 py-2 text-xs text-stone-400">No characters in this project.</p>
        ) : (
          <div className="px-3 py-2 flex flex-wrap gap-1.5">
            {characters.map((c) => (
              <div key={c.id} className="flex items-center gap-1 bg-stone-50 border border-stone-100 rounded-full px-2 py-0.5">
                <span className="text-xs text-stone-700">{c.name}</span>
                {c.role && <span className="text-[10px] text-stone-400">{c.role}</span>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Locations (${locations.length})`} icon={<MapPin className="w-3.5 h-3.5" />} defaultOpen={false}>
        {locations.length === 0 ? (
          <p className="px-3 py-2 text-xs text-stone-400">No locations in this project.</p>
        ) : (
          <div className="px-3 py-2 space-y-1.5">
            {locations.map((l) => (
              <div key={l.id} className="flex items-start gap-2">
                <MapPin className="w-3 h-3 text-stone-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-stone-700 font-medium">{l.name}</p>
                  {l.description && <p className="text-[11px] text-stone-400 line-clamp-1">{l.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {timelineEvents.length > 0 && (
        <Section title={`Timeline (${timelineEvents.length})`} icon={<Clock className="w-3.5 h-3.5" />} defaultOpen={false}>
          <div className="px-3 py-2 space-y-1.5">
            {timelineEvents.slice(0, 5).map((ev) => (
              <div key={ev.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-1.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-stone-700">{ev.label}</p>
                  {ev.event_date_text && <p className="text-[11px] text-stone-400">{ev.event_date_text}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {styleGuide?.tone && (
        <Section title="Style" icon={<BookOpen className="w-3.5 h-3.5" />} defaultOpen={false}>
          <div className="px-3 py-2.5">
            <p className="text-xs text-stone-600">{styleGuide.tone}</p>
          </div>
        </Section>
      )}

      <Section
        title={`Semantic Retrieval${retrievedItems?.length ? ` (${retrievedItems.length})` : ''}`}
        icon={<Sparkles className="w-3.5 h-3.5" />}
        defaultOpen={false}
      >
        <div className="px-3 py-2 space-y-2">
          {retrievalMeta && (
            <div className="text-[10px] text-stone-400 space-y-0.5">
              <div className="flex items-start gap-1.5">
                <Search className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span className="italic line-clamp-2">{retrievalMeta.queryText}</span>
              </div>
              <p className="pl-4">
                {retrievalMeta.metric} · top {retrievalMeta.topK} · min score {retrievalMeta.scoreThreshold}
                {!retrievalMeta.embeddingEnabled && (
                  <span className="ml-1 text-amber-500 font-medium">· embeddings disabled</span>
                )}
              </p>
            </div>
          )}
          {!retrievedItems || retrievedItems.length === 0 ? (
            <p className="text-[11px] text-stone-400">
              {retrievalMeta?.embeddingEnabled
                ? 'No relevant context found above threshold.'
                : 'Set EMBEDDING_PROVIDER to enable semantic retrieval.'}
            </p>
          ) : (
            <div className="space-y-1.5">
              {retrievedItems.map((item) => (
                <RetrievedItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </Section>

      <div className="px-3 py-3">
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-600 transition-colors"
        >
          <RefreshCcw className="w-3 h-3" />
          Refresh context
        </button>
      </div>
    </div>
  );
}

function RetrievedItemCard({ item }: { item: RetrievedItem }) {
  const [open, setOpen] = useState(false);
  const typeLabel = ENTITY_TYPE_LABEL[item.entityType] ?? item.entityType;
  const typeColor = ENTITY_TYPE_COLOR[item.entityType] ?? 'bg-stone-100 text-stone-600';
  const scorePercent = Math.round(item.score * 100);

  return (
    <div className="border border-stone-100 rounded-md overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 bg-stone-50 hover:bg-white transition-colors text-left"
      >
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${typeColor}`}>
          {typeLabel}
        </span>
        <span className="flex-1 text-[11px] text-stone-600 truncate">
          {item.entityLabel || item.entityId.slice(0, 8)}
        </span>
        <span className="text-[10px] text-stone-400 flex-shrink-0">{scorePercent}%</span>
        {open ? <ChevronUp className="w-3 h-3 text-stone-300" /> : <ChevronDown className="w-3 h-3 text-stone-300" />}
      </button>
      {open && (
        <div className="px-2.5 py-2 bg-white">
          <p className="text-[11px] text-stone-500 leading-relaxed">{item.chunkText}</p>
        </div>
      )}
    </div>
  );
}

function Section({
  title, icon, defaultOpen = true, children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors"
      >
        {icon}
        <span className="flex-1 text-left">{title}</span>
        {open
          ? <ArrowLeft className="w-3 h-3 text-stone-300 rotate-90" />
          : <ArrowRight className="w-3 h-3 text-stone-300 -rotate-90" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
