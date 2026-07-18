import { eq, and, asc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { scenes, chapters, characters, locations, worldbuildingNotes, timelineEvents, styleGuides } from '@/lib/db/schema';
import { getEmbeddingProvider, isEmbeddingEnabled } from '@/lib/ai/embeddings/factory';
import { Scene, Character, Location, WorldbuildingNote, TimelineEvent, StyleGuide } from '@/lib/types';
import { RetrievedItem, RetrievalMeta, ContextPack, OutlineContext, NearbyScenes } from '@/lib/types';

export interface RetrievalOptions {
  topK?: number;
  scoreThreshold?: number;
}

/**
 * Builds a compact query string from the scene's brief fields.
 * Used as the input to the embedding model.
 */
function buildQueryText(scene: Scene): string {
  return [
    scene.title,
    scene.summary,
    scene.pov && `POV: ${scene.pov}`,
    scene.goal && `Goal: ${scene.goal}`,
    scene.conflict && `Conflict: ${scene.conflict}`,
    scene.emotion && `Tone: ${scene.emotion}`,
  ].filter(Boolean).join('. ');
}

/**
 * Runs a cosine-similarity vector search against the embeddings table via the
 * match_embeddings Postgres function. Returns empty array when embeddings are
 * disabled or the query embedding is unavailable.
 */
async function vectorSearch(
  projectId: string,
  queryText: string,
  topK: number,
  scoreThreshold: number
): Promise<RetrievedItem[]> {
  if (!isEmbeddingEnabled()) return [];

  let queryEmbedding: number[];
  try {
    const provider = getEmbeddingProvider();
    const [vec] = await provider.embed([queryText]);
    queryEmbedding = vec;
  } catch {
    // Embedding call failed — degrade gracefully, return empty retrieval
    return [];
  }

  const vectorLiteral = `[${queryEmbedding.join(',')}]`;
  let data: Array<{
    id: string; entity_type: string; entity_id: string;
    chunk_text: string; chunk_index: number;
    metadata_json: { label?: string } | null; score: number;
  }>;
  try {
    const result = await db.execute(sql`
      select * from match_embeddings(
        ${vectorLiteral}::vector, ${projectId}::uuid, ${topK}::int, ${scoreThreshold}::float
      )
    `);
    data = result.rows as typeof data;
  } catch {
    return [];
  }

  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    entityType: row.entity_type as RetrievedItem['entityType'],
    entityId: row.entity_id,
    chunkText: row.chunk_text,
    chunkIndex: row.chunk_index,
    entityLabel: row.metadata_json?.label ?? '',
    score: row.score,
  }));
}

/**
 * Assemble the full context pack for a scene, including vector retrieval.
 * All DB reads are parallelised; retrieval runs concurrently with the relational queries.
 */
export async function getContextPackForScene(
  projectId: string,
  sceneId: string,
  options: RetrievalOptions = {}
): Promise<ContextPack> {
  const topK = options.topK ?? 10;
  const scoreThreshold = options.scoreThreshold ?? 0.5;

  const scene = await db
    .select()
    .from(scenes)
    .where(and(eq(scenes.id, sceneId), eq(scenes.project_id, projectId)))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!scene) throw new Error('Scene not found');

  const queryText = buildQueryText(scene as Scene);

  const [
    chapterData,
    siblingScenes,
    charactersRes,
    locationsRes,
    notesRes,
    eventsRes,
    styleRes,
    retrievedItems,
  ] = await Promise.all([
    db.query.chapters.findFirst({
      columns: { id: true, title: true, act_id: true },
      where: eq(chapters.id, scene.chapter_id),
      with: { acts: { columns: { id: true, title: true } } },
    }),
    db
      .select({ id: scenes.id, title: scenes.title, summary: scenes.summary, order_index: scenes.order_index })
      .from(scenes)
      .where(eq(scenes.chapter_id, scene.chapter_id))
      .orderBy(asc(scenes.order_index)),
    db.select().from(characters).where(eq(characters.project_id, projectId)).orderBy(asc(characters.name)),
    db.select().from(locations).where(eq(locations.project_id, projectId)).orderBy(asc(locations.name)),
    db.select().from(worldbuildingNotes).where(eq(worldbuildingNotes.project_id, projectId)),
    db.select().from(timelineEvents).where(eq(timelineEvents.project_id, projectId)).orderBy(asc(timelineEvents.created_at)),
    db.select().from(styleGuides).where(eq(styleGuides.project_id, projectId)).limit(1).then((r) => r[0] ?? null),
    vectorSearch(projectId, queryText, topK, scoreThreshold),
  ]);

  const actData = chapterData?.acts;
  const sceneIdx = siblingScenes.findIndex((s) => s.id === sceneId);

  const outlineContext: OutlineContext | null = chapterData
    ? {
        actId: actData?.id ?? '',
        actTitle: actData?.title ?? '',
        chapterId: chapterData.id,
        chapterTitle: chapterData.title,
        sceneCountInChapter: siblingScenes.length,
        sceneIndexInChapter: sceneIdx,
      }
    : null;

  const nearbyScenes: NearbyScenes = {
    previous: sceneIdx > 0
      ? { id: siblingScenes[sceneIdx - 1].id, title: siblingScenes[sceneIdx - 1].title, summary: siblingScenes[sceneIdx - 1].summary }
      : null,
    next: sceneIdx >= 0 && sceneIdx < siblingScenes.length - 1
      ? { id: siblingScenes[sceneIdx + 1].id, title: siblingScenes[sceneIdx + 1].title, summary: siblingScenes[sceneIdx + 1].summary }
      : null,
  };

  const retrievalMeta: RetrievalMeta = {
    queryText,
    topK,
    scoreThreshold,
    metric: 'cosine',
    hitCount: retrievedItems.length,
    embeddingEnabled: isEmbeddingEnabled(),
  };

  return {
    scene: scene as Scene,
    outlineContext,
    nearbyScenes,
    pinnedEntities: [],
    characters: charactersRes as Character[],
    locations: locationsRes as Location[],
    worldbuildingNotes: notesRes as WorldbuildingNote[],
    timelineEvents: eventsRes as TimelineEvent[],
    styleGuide: styleRes as StyleGuide | null,
    retrievedItems,
    retrievalMeta,
    // Keep backward-compat field populated
    embeddingResults: retrievedItems.map((r) => ({
      entityType: r.entityType,
      entityId: r.entityId,
      chunkText: r.chunkText,
      score: r.score,
    })),
  };
}
