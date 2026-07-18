-- Hand-written, idempotent SQL for the pieces that don't map onto a Drizzle
-- schema: the pgvector extension, the shared updated_at trigger, the HNSW
-- index, and the match_embeddings similarity-search function.
-- Run after `drizzle-kit push` has created the tables (see scripts/db-setup.ts).

-- ─── updated_at trigger ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_scenes_updated_at ON scenes;
CREATE TRIGGER trg_scenes_updated_at
  BEFORE UPDATE ON scenes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_style_guides_updated_at ON style_guides;
CREATE TRIGGER trg_style_guides_updated_at
  BEFORE UPDATE ON style_guides
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_eval_datasets_updated_at ON eval_datasets;
CREATE TRIGGER trg_eval_datasets_updated_at
  BEFORE UPDATE ON eval_datasets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_plan_chapters_updated_at ON plan_chapters;
CREATE TRIGGER trg_plan_chapters_updated_at
  BEFORE UPDATE ON plan_chapters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── HNSW index for cosine similarity search ───────────────────────────────
CREATE INDEX IF NOT EXISTS embeddings_hnsw_cosine_idx
  ON embeddings USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ─── match_embeddings RPC-equivalent function ──────────────────────────────
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding    vector(1536),
  match_project_id   uuid,
  match_count        int     DEFAULT 10,
  score_threshold    float   DEFAULT 0.5
)
RETURNS TABLE (
  id            uuid,
  entity_type   text,
  entity_id     uuid,
  chunk_text    text,
  chunk_index   int,
  metadata_json jsonb,
  score         float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    e.id,
    e.entity_type,
    e.entity_id,
    e.chunk_text,
    e.chunk_index,
    e.metadata_json,
    (1 - (e.embedding <=> query_embedding))::float AS score
  FROM embeddings e
  WHERE e.project_id = match_project_id
    AND e.embedding IS NOT NULL
    AND (1 - (e.embedding <=> query_embedding)) >= score_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;
