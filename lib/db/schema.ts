import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

// pgvector has no built-in Drizzle column type — define one backed by the
// `vector(n)` SQL type, serializing to/from the "[0.1,0.2,...]" wire format.
const vector = customType<{ data: number[]; driverData: string; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value) {
    return `[${value.join(',')}]`;
  },
  fromDriver(value) {
    return value
      .slice(1, -1)
      .split(',')
      .filter(Boolean)
      .map(Number);
  },
});

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

// Property keys below deliberately match the DB's snake_case column names
// (not camelCase) so query results are shape-compatible with the existing
// hand-written interfaces in lib/types.ts, which mirror the raw Postgres rows.

// ─── projects ──────────────────────────────────────────────────────────────
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  genre: text('genre').notNull().default(''),
  premise: text('premise').notNull().default(''),
  status: text('status').notNull().default('draft'),
  plan_template: text('plan_template'),
  plot_summary_short: text('plot_summary_short').notNull().default(''),
  plot_summary_expanded: jsonb('plot_summary_expanded')
    .$type<Array<{ chapterId: string; conflict: string; resolution: string; characterArcs: string }>>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  created_at: timestamptz('created_at').notNull().defaultNow(),
  updated_at: timestamptz('updated_at').notNull().defaultNow(),
});

// ─── acts ──────────────────────────────────────────────────────────────────
export const acts = pgTable('acts', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  order_index: integer('order_index').notNull().default(0),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('acts_project_id_idx').on(t.project_id),
}));

export const actsRelations = relations(acts, ({ many }) => ({
  chapters: many(chapters),
}));

// ─── chapters ──────────────────────────────────────────────────────────────
export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  act_id: uuid('act_id').notNull().references(() => acts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  order_index: integer('order_index').notNull().default(0),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('chapters_project_id_idx').on(t.project_id),
  actIdx: index('chapters_act_id_idx').on(t.act_id),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  acts: one(acts, { fields: [chapters.act_id], references: [acts.id] }),
  scenes: many(scenes),
}));

// ─── scenes ──────────────────────────────────────────────────────────────────
export const scenes = pgTable('scenes', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  chapter_id: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  content_md: text('content_md').notNull().default(''),
  pov: text('pov').notNull().default(''),
  goal: text('goal').notNull().default(''),
  conflict: text('conflict').notNull().default(''),
  emotion: text('emotion').notNull().default(''),
  status: text('status').notNull().default('draft'),
  order_index: integer('order_index').notNull().default(0),
  created_at: timestamptz('created_at').notNull().defaultNow(),
  updated_at: timestamptz('updated_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('scenes_project_id_idx').on(t.project_id),
  chapterIdx: index('scenes_chapter_id_idx').on(t.chapter_id),
}));

export const scenesRelations = relations(scenes, ({ one, many }) => ({
  chapters: one(chapters, { fields: [scenes.chapter_id], references: [chapters.id] }),
  scene_versions: many(sceneVersions),
}));

// ─── scene_versions ──────────────────────────────────────────────────────────
export const sceneVersions = pgTable('scene_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  scene_id: uuid('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  content_md: text('content_md').notNull(),
  word_count: integer('word_count').notNull().default(0),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  sceneIdx: index('scene_versions_scene_id_idx').on(t.scene_id),
}));

// ─── characters ──────────────────────────────────────────────────────────────
export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role').notNull().default(''),
  description: text('description').notNull().default(''),
  voice_notes: text('voice_notes').notNull().default(''),
  secrets: text('secrets').notNull().default(''),
  goals: text('goals').notNull().default(''),
  photos: jsonb('photos').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('characters_project_id_idx').on(t.project_id),
}));

// ─── locations ───────────────────────────────────────────────────────────────
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  rules: text('rules').notNull().default(''),
  sensory_notes: text('sensory_notes').notNull().default(''),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('locations_project_id_idx').on(t.project_id),
}));

// ─── worldbuilding_notes ───────────────────────────────────────────────────────
export const worldbuildingNotes = pgTable('worldbuilding_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  category: text('category').notNull().default('general'),
  title: text('title').notNull(),
  content_md: text('content_md').notNull().default(''),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('worldbuilding_notes_project_id_idx').on(t.project_id),
}));

// ─── timeline_events ───────────────────────────────────────────────────────────
export const timelineEvents = pgTable('timeline_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  event_date_text: text('event_date_text').notNull().default(''),
  description: text('description').notNull().default(''),
  related_scene_id: uuid('related_scene_id').references(() => scenes.id, { onDelete: 'set null' }),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('timeline_events_project_id_idx').on(t.project_id),
}));

// ─── style_guides ────────────────────────────────────────────────────────────
export const styleGuides = pgTable('style_guides', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  tone: text('tone').notNull().default(''),
  dos: text('dos').notNull().default(''),
  donts: text('donts').notNull().default(''),
  reference_text: text('reference_text').notNull().default(''),
  created_at: timestamptz('created_at').notNull().defaultNow(),
  updated_at: timestamptz('updated_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('style_guides_project_id_idx').on(t.project_id),
}));

// ─── entity_links ────────────────────────────────────────────────────────────
export const entityLinks = pgTable('entity_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  source_type: text('source_type').notNull(),
  source_id: uuid('source_id').notNull(),
  target_type: text('target_type').notNull(),
  target_id: uuid('target_id').notNull(),
  relation_type: text('relation_type').notNull().default(''),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('entity_links_project_id_idx').on(t.project_id),
  sourceIdx: index('entity_links_source_idx').on(t.source_type, t.source_id),
  targetIdx: index('entity_links_target_idx').on(t.target_type, t.target_id),
}));

// ─── ai_runs ─────────────────────────────────────────────────────────────────
export const aiRuns = pgTable('ai_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  scene_id: uuid('scene_id').references(() => scenes.id, { onDelete: 'set null' }),
  task_type: text('task_type').notNull(),
  provider: text('provider').notNull().default('stub'),
  model: text('model').notNull().default('stub'),
  prompt_text: text('prompt_text').notNull().default(''),
  output_text: text('output_text').notNull().default(''),
  context_manifest_json: jsonb('context_manifest_json').$type<Record<string, unknown>>(),
  prompt_version: text('prompt_version'),
  latency_ms: integer('latency_ms'),
  token_usage_json: jsonb('token_usage_json').$type<Record<string, unknown>>(),
  retrieval_meta_json: jsonb('retrieval_meta_json').$type<Record<string, unknown>>(),
  parsed_json: jsonb('parsed_json').$type<Record<string, unknown>>(),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('ai_runs_project_id_idx').on(t.project_id),
  sceneIdx: index('ai_runs_scene_id_idx').on(t.scene_id),
}));

// ─── embeddings ──────────────────────────────────────────────────────────────
export const embeddings = pgTable('embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  entity_type: text('entity_type').notNull(),
  entity_id: uuid('entity_id').notNull(),
  chunk_text: text('chunk_text').notNull().default(''),
  chunk_index: integer('chunk_index').notNull().default(0),
  metadata_json: jsonb('metadata_json').$type<{ label?: string } & Record<string, unknown>>(),
  embedding: vector('embedding', { dimensions: 1536 }),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('embeddings_project_id_idx').on(t.project_id),
  entityIdx: index('embeddings_entity_idx').on(t.entity_type, t.entity_id),
}));

// ─── eval_datasets ───────────────────────────────────────────────────────────
export const evalDatasets = pgTable('eval_datasets', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  task_type: text('task_type').notNull(),
  created_at: timestamptz('created_at').notNull().defaultNow(),
  updated_at: timestamptz('updated_at').notNull().defaultNow(),
});

// ─── eval_cases ──────────────────────────────────────────────────────────────
export const evalCases = pgTable('eval_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  dataset_id: uuid('dataset_id').notNull().references(() => evalDatasets.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  input_json: jsonb('input_json').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  golden_output_json: jsonb('golden_output_json').$type<Record<string, unknown>>(),
  notes: text('notes').notNull().default(''),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  datasetIdx: index('eval_cases_dataset_idx').on(t.dataset_id),
}));

// ─── eval_runs ───────────────────────────────────────────────────────────────
export const evalRuns = pgTable('eval_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  dataset_id: uuid('dataset_id').notNull().references(() => evalDatasets.id, { onDelete: 'cascade' }),
  prompt_version: text('prompt_version').notNull(),
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  total_cases: integer('total_cases').notNull().default(0),
  passed_cases: integer('passed_cases').notNull().default(0),
  mean_score: doublePrecision('mean_score'),
  summary_json: jsonb('summary_json').$type<Record<string, unknown>>(),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  datasetIdx: index('eval_runs_dataset_idx').on(t.dataset_id),
}));

// ─── eval_results ────────────────────────────────────────────────────────────
export const evalResults = pgTable('eval_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  run_id: uuid('run_id').notNull().references(() => evalRuns.id, { onDelete: 'cascade' }),
  case_id: uuid('case_id').notNull().references(() => evalCases.id, { onDelete: 'cascade' }),
  raw_output: text('raw_output').notNull().default(''),
  parsed_output: jsonb('parsed_output').$type<Record<string, unknown>>(),
  scores_json: jsonb('scores_json').$type<Record<string, number>>().notNull().default(sql`'{}'::jsonb`),
  total_score: doublePrecision('total_score'),
  passed: boolean('passed').notNull().default(false),
  judge_verdict: jsonb('judge_verdict').$type<Record<string, unknown>>(),
  latency_ms: integer('latency_ms'),
  token_usage_json: jsonb('token_usage_json').$type<Record<string, unknown>>(),
  error: text('error'),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  runIdx: index('eval_results_run_idx').on(t.run_id),
  caseIdx: index('eval_results_case_idx').on(t.case_id),
}));

// ─── plan_chapters ───────────────────────────────────────────────────────────
export const planChapters = pgTable('plan_chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default(''),
  summary: text('summary').notNull().default(''),
  pov_character: text('pov_character').notNull().default(''),
  status: text('status').notNull().default('planned'),
  order_index: integer('order_index').notNull().default(0),
  created_at: timestamptz('created_at').notNull().defaultNow(),
  updated_at: timestamptz('updated_at').notNull().defaultNow(),
}, (t) => ({
  projectIdx: index('plan_chapters_project_idx').on(t.project_id, t.order_index),
}));

export const planChaptersRelations = relations(planChapters, ({ many }) => ({
  plan_scenes: many(planScenes),
}));

// ─── plan_scenes ─────────────────────────────────────────────────────────────
export const planScenes = pgTable('plan_scenes', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  chapter_id: uuid('chapter_id').notNull().references(() => planChapters.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default(''),
  description: text('description').notNull().default(''),
  characters: text('characters').notNull().default(''),
  setting: text('setting').notNull().default(''),
  purpose: text('purpose').notNull().default('plot'),
  order_index: integer('order_index').notNull().default(0),
  created_at: timestamptz('created_at').notNull().defaultNow(),
}, (t) => ({
  chapterIdx: index('plan_scenes_chapter_idx').on(t.chapter_id, t.order_index),
  projectIdx: index('plan_scenes_project_idx').on(t.project_id),
}));

export const planScenesRelations = relations(planScenes, ({ one }) => ({
  plan_chapters: one(planChapters, { fields: [planScenes.chapter_id], references: [planChapters.id] }),
}));
