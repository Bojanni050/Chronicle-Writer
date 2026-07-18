export type PlanChapterStatus = 'planned' | 'draft' | 'complete';
export type PlanScenePurpose = 'plot' | 'character' | 'world-building';

export interface PlanChapter {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  pov_character: string;
  status: PlanChapterStatus;
  order_index: number;
  created_at: string;
  updated_at: string;
  scenes?: PlanScene[];
}

export interface PlanScene {
  id: string;
  project_id: string;
  chapter_id: string;
  title: string;
  description: string;
  characters: string;
  setting: string;
  purpose: PlanScenePurpose;
  order_index: number;
  created_at: string;
}

export interface PlotExpandedEntry {
  chapterId: string;
  conflict: string;
  resolution: string;
  characterArcs: string;
}

export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  stages: Array<{ title: string; summary: string }>;
}
