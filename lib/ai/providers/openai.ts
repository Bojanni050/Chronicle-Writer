import { TextGenerationProvider, GenerationInput, GenerationOutput } from './types';

const BASE = 'https://api.openai.com/v1';

export class OpenAiProvider implements TextGenerationProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(input: GenerationInput): Promise<GenerationOutput> {
    const messages: Array<{ role: string; content: string }> = [];
    if (input.systemPrompt) messages.push({ role: 'system', content: input.systemPrompt });
    messages.push({ role: 'user', content: input.userPrompt });

    const body: Record<string, unknown> = {
      model: input.model,
      messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 2000,
    };
    if (input.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    return {
      text: choice?.message?.content ?? '',
      usage: {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
      },
      raw: data,
    };
  }
}
