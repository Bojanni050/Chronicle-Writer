import { LlmProviderName } from './providers/types';

export type TaskType = 'brainstorm' | 'draft' | 'rewrite' | 'continuity_check';

export interface ModelConfig {
  provider: LlmProviderName;
  model: string;
  temperature: number;
  maxTokens: number;
}

// Defaults are read from environment variables so they can be overridden without
// a code change. The base provider for all tasks comes from AI_PROVIDER.
function resolveProvider(): LlmProviderName {
  return (process.env.AI_PROVIDER as LlmProviderName) ?? 'stub';
}

const TASK_DEFAULTS: Record<TaskType, Omit<ModelConfig, 'provider'>> = {
  brainstorm: {
    model: process.env.AI_BRAINSTORM_MODEL ?? process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o',
    temperature: 0.9,
    maxTokens: 1200,
  },
  draft: {
    model: process.env.AI_DRAFT_MODEL ?? process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o',
    temperature: 0.8,
    maxTokens: 2500,
  },
  rewrite: {
    model: process.env.AI_REWRITE_MODEL ?? process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o',
    temperature: 0.65,
    maxTokens: 2500,
  },
  continuity_check: {
    model: process.env.AI_CONTINUITY_MODEL ?? process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o',
    temperature: 0.2,
    maxTokens: 1000,
  },
};

// Anthropic model overrides — used when AI_PROVIDER=anthropic
const ANTHROPIC_MODEL_MAP: Record<TaskType, string> = {
  brainstorm: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022',
  draft: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022',
  rewrite: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022',
  continuity_check: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-haiku-20241022',
};

// Ollama model overrides
const OLLAMA_MODEL_MAP: Record<TaskType, string> = {
  brainstorm: process.env.OLLAMA_CHAT_MODEL ?? 'llama3.2',
  draft: process.env.OLLAMA_CHAT_MODEL ?? 'llama3.2',
  rewrite: process.env.OLLAMA_CHAT_MODEL ?? 'llama3.2',
  continuity_check: process.env.OLLAMA_CHAT_MODEL ?? 'llama3.2',
};

export function getModelConfig(task: TaskType): ModelConfig {
  const provider = resolveProvider();
  const base = TASK_DEFAULTS[task];

  let model = base.model;
  if (provider === 'anthropic') model = ANTHROPIC_MODEL_MAP[task];
  if (provider === 'ollama') model = OLLAMA_MODEL_MAP[task];

  return { provider, model, temperature: base.temperature, maxTokens: base.maxTokens };
}
