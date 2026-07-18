import type { TaskType } from '@/lib/ai/config';

export interface PromptRecord {
  version: string;
  releasedAt: string;
  changelog: string;
}

// Bump the version string here whenever you change a prompt for a task.
// Format: YYYY-MM-DD.N (date + daily patch).
export const PROMPT_VERSIONS: Record<TaskType, PromptRecord> = {
  brainstorm: {
    version: '2025-07-18.1',
    releasedAt: '2025-07-18',
    changelog: 'Initial version — 5 suggestions, risks, recommended direction.',
  },
  draft: {
    version: '2025-07-18.1',
    releasedAt: '2025-07-18',
    changelog: 'Initial version — prose-only output, no meta-commentary.',
  },
  rewrite: {
    version: '2025-07-18.1',
    releasedAt: '2025-07-18',
    changelog: 'Initial version — JSON {rewrittenText, notes} output.',
  },
  continuity_check: {
    version: '2025-07-18.1',
    releasedAt: '2025-07-18',
    changelog: 'Initial version — issues array with severity levels.',
  },
};

export function getPromptVersion(task: TaskType): string {
  return PROMPT_VERSIONS[task].version;
}
