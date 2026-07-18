import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  embeddings,
  scenes,
  characters,
  locations,
  worldbuildingNotes,
  timelineEvents,
  styleGuides,
} from '@/lib/db/schema';
import { getEmbeddingProvider } from '@/lib/ai/embeddings/factory';
import { EmbeddingChunk, EntityType } from './chunker';

const TABLES = {
  scenes,
  characters,
  locations,
  worldbuilding_notes: worldbuildingNotes,
  timeline_events: timelineEvents,
} as const;

/**
 * Delete all existing embedding chunks for an entity, then insert fresh ones
 * with newly-generated embedding vectors.
 */
export async function reindexEntity(
  projectId: string,
  entityType: EntityType,
  entityId: string,
  chunks: EmbeddingChunk[]
): Promise<void> {
  // Remove stale chunks
  await db
    .delete(embeddings)
    .where(and(
      eq(embeddings.project_id, projectId),
      eq(embeddings.entity_type, entityType),
      eq(embeddings.entity_id, entityId)
    ));

  if (chunks.length === 0) return;

  const provider = getEmbeddingProvider();
  const texts = chunks.map((c) => c.chunkText);
  const vectors = await provider.embed(texts);

  const rows = chunks.map((c, i) => ({
    project_id: projectId,
    entity_type: c.entityType,
    entity_id: c.entityId,
    chunk_index: c.chunkIndex,
    chunk_text: c.chunkText,
    metadata_json: c.metadataJson,
    embedding: vectors[i],
  }));

  try {
    await db.insert(embeddings).values(rows);
  } catch (err) {
    throw new Error(`Embedding insert failed: ${(err as Error).message}`);
  }
}

export interface ReindexProjectResult {
  indexed: number;
  skipped: number;
  errors: string[];
}

/**
 * Full project reindex: processes all entity types for a project.
 * Runs scene/character/location/worldbuilding/timeline/style chunks in sequence
 * to avoid hitting embedding API rate limits.
 */
export async function reindexProject(projectId: string): Promise<ReindexProjectResult> {
  const {
    buildChunksForScene,
    buildChunksForCharacter,
    buildChunksForLocation,
    buildChunksForWorldNote,
    buildChunksForTimelineEvent,
    buildChunksForStyleGuide,
  } = await import('./chunker');

  const result: ReindexProjectResult = { indexed: 0, skipped: 0, errors: [] };

  async function processEntities<T extends { id: string }>(
    tableName: keyof typeof TABLES,
    buildFn: (entity: T) => EmbeddingChunk[],
    entityType: EntityType
  ) {
    const table = TABLES[tableName] as any;
    let data: T[];
    try {
      data = (await db.select().from(table).where(eq(table.project_id, projectId))) as T[];
    } catch (err) {
      result.errors.push(`${tableName}: ${(err as Error).message}`);
      return;
    }

    for (const entity of data) {
      try {
        const chunks = buildFn(entity);
        if (chunks.length === 0) { result.skipped++; continue; }
        await reindexEntity(projectId, entityType, entity.id, chunks);
        result.indexed++;
      } catch (err) {
        result.errors.push(`${entityType}/${entity.id}: ${(err as Error).message}`);
      }
    }
  }

  await processEntities('scenes', buildChunksForScene, 'scene');
  await processEntities('characters', buildChunksForCharacter, 'character');
  await processEntities('locations', buildChunksForLocation, 'location');
  await processEntities('worldbuilding_notes', buildChunksForWorldNote, 'worldbuilding_note');
  await processEntities('timeline_events', buildChunksForTimelineEvent, 'timeline_event');

  // Style guide: one per project
  const sg = await db
    .select()
    .from(styleGuides)
    .where(eq(styleGuides.project_id, projectId))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (sg) {
    try {
      const chunks = buildChunksForStyleGuide(sg);
      await reindexEntity(projectId, 'style_guide', sg.id, chunks);
      result.indexed++;
    } catch (err) {
      result.errors.push(`style_guide: ${(err as Error).message}`);
    }
  }

  return result;
}
