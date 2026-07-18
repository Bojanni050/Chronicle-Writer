export type AiProvider = 'stub' | 'openai' | 'anthropic' | 'ollama';
export type AiModel = string;

export interface AiRequest {
  provider: AiProvider;
  model: AiModel;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export interface AiResponse {
  text: string;
  provider: AiProvider;
  model: AiModel;
  tokensUsed?: number;
}

// Stub implementation — replace this function to swap in a real LLM provider.
async function callStub(req: AiRequest): Promise<AiResponse> {
  await new Promise((r) => setTimeout(r, 600));
  return {
    text: `[Stub response for task]\n\nProvider: ${req.provider}\nModel: ${req.model}\n\n${req.userPrompt.slice(0, 120)}...`,
    provider: req.provider,
    model: req.model,
    tokensUsed: 0,
  };
}

export async function callAi(req: AiRequest): Promise<AiResponse> {
  switch (req.provider) {
    case 'stub':
      return callStub(req);
    default:
      throw new Error(`Provider "${req.provider}" is not yet wired up.`);
  }
}
