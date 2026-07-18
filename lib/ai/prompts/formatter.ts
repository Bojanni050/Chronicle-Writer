import { Scene, Character, Location, WorldbuildingNote, TimelineEvent, StyleGuide } from '@/lib/types';
import type { RetrievedItem } from '@/lib/types';

// Rough token estimate: 1 token ≈ 4 characters. Used to budget context sections.
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + '…';
}

// Per-section character limits that keep total prompt size reasonable.
const LIMITS = {
  sceneContent: 3000,    // existing prose
  sceneSummary: 400,
  nearbyScene: 200,
  character: 300,
  location: 200,
  worldNote: 250,
  timelineEvent: 120,
  styleGuide: 600,
  retrievalChunk: 180,
  maxCharacters: 6,
  maxLocations: 4,
  maxWorldNotes: 4,
  maxTimeline: 5,
  maxRetrieval: 6,
};

export interface FormattedContext {
  sceneSection: string;
  outlineSection: string;
  nearbyScenesSection: string;
  charactersSection: string;
  locationsSection: string;
  worldSection: string;
  timelineSection: string;
  styleSection: string;
  retrievalSection: string;
  estimatedTokens: number;
}

export interface ContextInput {
  scene: Scene;
  outlineContext?: { actTitle: string; chapterTitle: string; sceneIndexInChapter: number; sceneCountInChapter: number } | null;
  nearbyScenes?: { previous?: { title: string; summary: string } | null; next?: { title: string; summary: string } | null };
  characters: Character[];
  locations: Location[];
  worldbuildingNotes: WorldbuildingNote[];
  timelineEvents: TimelineEvent[];
  styleGuide: StyleGuide | null;
  retrievedItems: RetrievedItem[];
  includeContent?: boolean;
}

export function formatContext(ctx: ContextInput): FormattedContext {
  // ── Scene ────────────────────────────────────────────────────────────────
  const brief = [
    ctx.scene.pov && `POV: ${ctx.scene.pov}`,
    ctx.scene.goal && `Goal: ${truncate(ctx.scene.goal, 120)}`,
    ctx.scene.conflict && `Conflict: ${truncate(ctx.scene.conflict, 120)}`,
    ctx.scene.emotion && `Tone/Emotion: ${ctx.scene.emotion}`,
    ctx.scene.summary && `Summary: ${truncate(ctx.scene.summary, LIMITS.sceneSummary)}`,
  ].filter(Boolean).join('\n');

  const content = ctx.includeContent && ctx.scene.content_md
    ? `\n\nCurrent prose:\n${truncate(ctx.scene.content_md, LIMITS.sceneContent)}`
    : '';

  const sceneSection = `Scene: "${ctx.scene.title}"\n${brief}${content}`.trim();

  // ── Outline ──────────────────────────────────────────────────────────────
  const outlineSection = ctx.outlineContext
    ? `Outline position: ${ctx.outlineContext.actTitle} › ${ctx.outlineContext.chapterTitle} (scene ${ctx.outlineContext.sceneIndexInChapter + 1} of ${ctx.outlineContext.sceneCountInChapter})`
    : '';

  // ── Nearby scenes ────────────────────────────────────────────────────────
  const nearby: string[] = [];
  if (ctx.nearbyScenes?.previous) {
    nearby.push(`← Previous: "${ctx.nearbyScenes.previous.title}" — ${truncate(ctx.nearbyScenes.previous.summary || '(no summary)', LIMITS.nearbyScene)}`);
  }
  if (ctx.nearbyScenes?.next) {
    nearby.push(`→ Next: "${ctx.nearbyScenes.next.title}" — ${truncate(ctx.nearbyScenes.next.summary || '(no summary)', LIMITS.nearbyScene)}`);
  }
  const nearbyScenesSection = nearby.length ? `Adjacent scenes:\n${nearby.join('\n')}` : '';

  // ── Characters ───────────────────────────────────────────────────────────
  const chars = ctx.characters.slice(0, LIMITS.maxCharacters).map((c) => {
    const lines = [
      `${c.name}${c.role ? ` (${c.role})` : ''}`,
      c.description && truncate(c.description, LIMITS.character),
      c.voice_notes && `Voice: ${truncate(c.voice_notes, 100)}`,
      c.goals && `Goals: ${truncate(c.goals, 100)}`,
    ].filter(Boolean);
    return lines.join(' | ');
  });
  const charactersSection = chars.length ? `Characters:\n${chars.map((l) => `- ${l}`).join('\n')}` : '';

  // ── Locations ────────────────────────────────────────────────────────────
  const locs = ctx.locations.slice(0, LIMITS.maxLocations).map((l) => {
    const parts = [l.name, l.description && truncate(l.description, LIMITS.location)].filter(Boolean);
    return parts.join(': ');
  });
  const locationsSection = locs.length ? `Locations:\n${locs.map((l) => `- ${l}`).join('\n')}` : '';

  // ── World / Lore ─────────────────────────────────────────────────────────
  const notes = ctx.worldbuildingNotes.slice(0, LIMITS.maxWorldNotes).map((n) => {
    return `${n.title}${n.category ? ` [${n.category}]` : ''}: ${truncate(n.content_md, LIMITS.worldNote)}`;
  });
  const worldSection = notes.length ? `World / Lore:\n${notes.map((n) => `- ${n}`).join('\n')}` : '';

  // ── Timeline ─────────────────────────────────────────────────────────────
  const events = ctx.timelineEvents.slice(0, LIMITS.maxTimeline).map((e) => {
    return `${e.label}${e.event_date_text ? ` (${e.event_date_text})` : ''}${e.description ? ': ' + truncate(e.description, 80) : ''}`;
  });
  const timelineSection = events.length ? `Timeline:\n${events.map((e) => `- ${e}`).join('\n')}` : '';

  // ── Style guide ──────────────────────────────────────────────────────────
  const sg = ctx.styleGuide;
  const styleSection = sg
    ? [
        sg.tone && `Tone: ${truncate(sg.tone, 200)}`,
        sg.dos && `Do: ${truncate(sg.dos, 200)}`,
        sg.donts && `Avoid: ${truncate(sg.donts, 200)}`,
      ].filter(Boolean).join('\n')
    : '';

  // ── Retrieval hits ───────────────────────────────────────────────────────
  const hits = ctx.retrievedItems.slice(0, LIMITS.maxRetrieval).map((r) => {
    return `[${r.entityType}] ${r.entityLabel ? r.entityLabel + ': ' : ''}${truncate(r.chunkText, LIMITS.retrievalChunk)} (score: ${r.score.toFixed(2)})`;
  });
  const retrievalSection = hits.length ? `Semantically relevant context:\n${hits.map((h) => `- ${h}`).join('\n')}` : '';

  const all = [sceneSection, outlineSection, nearbyScenesSection, charactersSection,
    locationsSection, worldSection, timelineSection, styleSection, retrievalSection]
    .filter(Boolean).join('\n\n');

  return {
    sceneSection, outlineSection, nearbyScenesSection, charactersSection,
    locationsSection, worldSection, timelineSection, styleSection, retrievalSection,
    estimatedTokens: estimateTokens(all),
  };
}

/** Render a FormattedContext object to a compact, readable string. */
export function renderContext(ctx: FormattedContext): string {
  return [
    ctx.outlineSection,
    ctx.nearbyScenesSection,
    ctx.charactersSection,
    ctx.locationsSection,
    ctx.worldSection,
    ctx.timelineSection,
    ctx.styleSection,
    ctx.retrievalSection,
  ].filter(Boolean).join('\n\n');
}
