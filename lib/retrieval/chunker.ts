import { Character, Location, WorldbuildingNote, TimelineEvent, StyleGuide, Scene } from '@/lib/types';

export type EntityType =
  | 'scene'
  | 'character'
  | 'location'
  | 'worldbuilding_note'
  | 'timeline_event'
  | 'style_guide';

export interface EmbeddingChunk {
  entityType: EntityType;
  entityId: string;
  chunkIndex: number;
  chunkText: string;
  metadataJson: { label: string; [key: string]: unknown };
}

function chunk(entityType: EntityType, entityId: string, label: string, texts: (string | undefined | null)[]): EmbeddingChunk[] {
  return texts
    .filter((t): t is string => Boolean(t?.trim()))
    .map((t, i) => ({
      entityType,
      entityId,
      chunkIndex: i,
      chunkText: t.trim(),
      metadataJson: { label },
    }));
}

export function buildChunksForScene(scene: Scene): EmbeddingChunk[] {
  const parts: string[] = [];

  // Chunk 0: metadata block — always present, used for any scene query
  const meta = [
    `Scene: ${scene.title}`,
    scene.pov && `POV: ${scene.pov}`,
    scene.goal && `Goal: ${scene.goal}`,
    scene.conflict && `Conflict: ${scene.conflict}`,
    scene.emotion && `Tone: ${scene.emotion}`,
    scene.summary && `Summary: ${scene.summary}`,
  ].filter(Boolean).join('\n');
  parts.push(meta);

  // Chunk 1+: content in 800-char segments (roughly 200 tokens each)
  if (scene.content_md?.trim()) {
    const CHUNK_SIZE = 800;
    const OVERLAP = 100;
    const text = scene.content_md.trim();
    let pos = 0;
    while (pos < text.length) {
      parts.push(text.slice(pos, pos + CHUNK_SIZE));
      pos += CHUNK_SIZE - OVERLAP;
    }
  }

  return parts.map((t, i) => ({
    entityType: 'scene',
    entityId: scene.id,
    chunkIndex: i,
    chunkText: t,
    metadataJson: { label: scene.title },
  }));
}

export function buildChunksForCharacter(c: Character): EmbeddingChunk[] {
  const texts = [
    [
      `Character: ${c.name}`,
      c.role && `Role: ${c.role}`,
      c.description,
    ].filter(Boolean).join('\n'),
    c.voice_notes && `${c.name} voice and speech: ${c.voice_notes}`,
    [c.goals && `${c.name} goals: ${c.goals}`, c.secrets && `${c.name} secrets: ${c.secrets}`]
      .filter(Boolean).join('\n') || undefined,
  ];
  return chunk('character', c.id, c.name, texts);
}

export function buildChunksForLocation(l: Location): EmbeddingChunk[] {
  const texts = [
    [`Location: ${l.name}`, l.description].filter(Boolean).join('\n'),
    l.sensory_notes && `${l.name} sensory atmosphere: ${l.sensory_notes}`,
    l.rules && `${l.name} rules and constraints: ${l.rules}`,
  ];
  return chunk('location', l.id, l.name, texts);
}

export function buildChunksForWorldNote(n: WorldbuildingNote): EmbeddingChunk[] {
  const texts = [
    [`${n.title}${n.category ? ` [${n.category}]` : ''}`, n.content_md].filter(Boolean).join('\n'),
  ];
  return chunk('worldbuilding_note', n.id, n.title, texts);
}

export function buildChunksForTimelineEvent(e: TimelineEvent): EmbeddingChunk[] {
  const texts = [
    [
      `Timeline event: ${e.label}`,
      e.event_date_text && `Date: ${e.event_date_text}`,
      e.description,
    ].filter(Boolean).join('\n'),
  ];
  return chunk('timeline_event', e.id, e.label, texts);
}

export function buildChunksForStyleGuide(sg: StyleGuide): EmbeddingChunk[] {
  const texts = [
    [`Writing style guide`, sg.tone && `Tone: ${sg.tone}`, sg.dos && `Do: ${sg.dos}`, sg.donts && `Avoid: ${sg.donts}`]
      .filter(Boolean).join('\n'),
    sg.reference_text && `Reference prose example:\n${sg.reference_text}`,
  ];
  return chunk('style_guide', sg.id, 'Style Guide', texts);
}
