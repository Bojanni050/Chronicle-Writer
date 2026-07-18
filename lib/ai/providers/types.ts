export interface GenerationInput {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  model: string;
  maxTokens?: number;
  /** 'json' requests structured JSON output from the provider when available. */
  responseFormat?: 'text' | 'json';
}

export interface GenerationOutput {
  text: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  raw?: unknown;
}

export interface TextGenerationProvider {
  generate(input: GenerationInput): Promise<GenerationOutput>;
}

export type LlmProviderName = 'openai' | 'anthropic' | 'ollama' | 'stub';
