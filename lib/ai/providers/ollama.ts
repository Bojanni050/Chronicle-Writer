import { TextGenerationProvider, GenerationInput, GenerationOutput } from './types';

export class OllamaProvider implements TextGenerationProvider {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async generate(input: GenerationInput): Promise<GenerationOutput> {
    const messages: Array<{ role: string; content: string }> = [];
    if (input.systemPrompt) messages.push({ role: 'system', content: input.systemPrompt });

    const userPrompt =
      input.responseFormat === 'json'
        ? `${input.userPrompt}\n\nRespond ONLY with valid JSON.`
        : input.userPrompt;
    messages.push({ role: 'user', content: userPrompt });

    const body: Record<string, unknown> = {
      model: input.model,
      messages,
      stream: false,
      options: { temperature: input.temperature ?? 0.7 },
    };
    if (input.responseFormat === 'json') body.format = 'json';

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return {
      text: data.message?.content ?? '',
      usage: {
        inputTokens: data.prompt_eval_count,
        outputTokens: data.eval_count,
      },
      raw: data,
    };
  }
}
