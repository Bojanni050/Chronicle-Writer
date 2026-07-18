export type ProjectStatus = 'draft' | 'active' | 'complete' | 'archived';
export type SceneStatus = 'draft' | 'written' | 'revised' | 'final';

export interface Project {
  id: string;
  title: string;
  genre: string;
  premise: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Act {
  id: string;
  project_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  project_id: string;
  act_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface Scene {
  id: string;
  project_id: string;
  chapter_id: string;
  title: string;
  summary: string;
  content_md: string;
  pov: string;
  goal: string;
  conflict: string;
  emotion: string;
  status: SceneStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface SceneVersion {
  id: string;
  scene_id: string;
  content_md: string;
  word_count: number;
  created_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  role: string;
  description: string;
  voice_notes: string;
  secrets: string;
  goals: string;
  photos: string[];
  created_at: string;
}

export interface Location {
  id: string;
  project_id: string;
  name: string;
  description: string;
  rules: string;
  sensory_notes: string;
  created_at: string;
}

export interface WorldbuildingNote {
  id: string;
  project_id: string;
  category: string;
  title: string;
  content_md: string;
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  project_id: string;
  label: string;
  event_date_text: string;
  description: string;
  related_scene_id: string | null;
  created_at: string;
}

export interface StyleGuide {
  id: string;
  project_id: string;
  tone: string;
  dos: string;
  donts: string;
  reference_text: string;
  created_at: string;
  updated_at: string;
}

export interface EntityLink {
  id: string;
  project_id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relation_type: string;
  created_at: string;
}

export interface AiRun {
  id: string;
  project_id: string;
  scene_id: string | null;
  task_type: string;
  provider: string;
  model: string;
  prompt_text: string;
  output_text: string;
  context_manifest_json: Record<string, unknown> | null;
  created_at: string;
}

// ─── Composite types ─────────────────────────────────────────────────────────

export interface ChapterWithScenes extends Chapter {
  scenes: Scene[];
}

export interface ActWithChapters extends Act {
  chapters: ChapterWithScenes[];
}

export interface ProjectStructure {
  project: Project;
  acts: ActWithChapters[];
}

// ─── Context Pack ─────────────────────────────────────────────────────────────

export interface OutlineContext {
  actId: string;
  actTitle: string;
  chapterId: string;
  chapterTitle: string;
  sceneCountInChapter: number;
  sceneIndexInChapter: number;
}

export interface NearbyScenes {
  previous: { id: string; title: string; summary: string } | null;
  next: { id: string; title: string; summary: string } | null;
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

export type EntityType =
  | 'scene'
  | 'character'
  | 'location'
  | 'worldbuilding_note'
  | 'timeline_event'
  | 'style_guide';

export interface RetrievedItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  chunkText: string;
  chunkIndex: number;
  entityLabel: string;
  score: number;
}

export interface RetrievalMeta {
  queryText: string;
  topK: number;
  scoreThreshold: number;
  metric: 'cosine';
  hitCount: number;
  embeddingEnabled: boolean;
}

// ─── Structured AI outputs ────────────────────────────────────────────────────

export interface BrainstormSuggestion {
  title: string;
  description: string;
}

export interface BrainstormResult {
  suggestions: BrainstormSuggestion[];
  risks?: string[];
  recommendedDirection?: string;
}

export interface RewriteResult {
  rewrittenText: string;
  notes?: string;
}

export interface ContinuityIssue {
  description: string;
  severity: 'low' | 'medium' | 'high';
  relatedEntities?: string[];
}

export interface ContinuityCheckResult {
  issues: ContinuityIssue[];
  overallStatus: 'clean' | 'minor_issues' | 'major_issues';
  summary?: string;
}

// ─── Cost ─────────────────────────────────────────────────────────────────────

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
  model: string;
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

export interface EvalDataset {
  id: string;
  project_id: string;
  name: string;
  description: string;
  task_type: string;
  created_at: string;
  updated_at: string;
}

export interface EvalCase {
  id: string;
  dataset_id: string;
  label: string;
  input_json: Record<string, unknown>;
  golden_output_json: Record<string, unknown> | null;
  notes: string;
  created_at: string;
}

export interface EvalRun {
  id: string;
  dataset_id: string;
  prompt_version: string;
  provider: string;
  model: string;
  total_cases: number;
  passed_cases: number;
  mean_score: number | null;
  summary_json: Record<string, unknown> | null;
  created_at: string;
}

export interface EvalResult {
  id: string;
  run_id: string;
  case_id: string;
  raw_output: string;
  parsed_output: Record<string, unknown> | null;
  scores_json: Record<string, number>;
  total_score: number | null;
  passed: boolean;
  judge_verdict: Record<string, unknown> | null;
  latency_ms: number | null;
  token_usage_json: { inputTokens?: number; outputTokens?: number } | null;
  error: string | null;
  created_at: string;
}

// ─── AI Run (extended) ────────────────────────────────────────────────────────

export interface AiRunExtended extends AiRun {
  latency_ms: number | null;
  token_usage_json: { inputTokens?: number; outputTokens?: number } | null;
  retrieval_meta_json: RetrievalMeta | null;
  parsed_json: Record<string, unknown> | null;
}

// ─── Context Pack ─────────────────────────────────────────────────────────────

export interface ContextPack {
  scene: Scene | null;
  outlineContext: OutlineContext | null;
  nearbyScenes: NearbyScenes;
  pinnedEntities: Array<{ type: string; id: string; label: string }>;
  characters: Character[];
  locations: Location[];
  worldbuildingNotes: WorldbuildingNote[];
  timelineEvents: TimelineEvent[];
  styleGuide: StyleGuide | null;
  retrievedItems: RetrievedItem[];
  retrievalMeta: RetrievalMeta;
  /** @deprecated Use retrievedItems instead. Kept for backward compat. */
  embeddingResults: Array<{ entityType: string; entityId: string; chunkText: string; score: number }>;
}
