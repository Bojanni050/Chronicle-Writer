import { TextGenerationProvider, GenerationInput, GenerationOutput } from './types';

const BASE = 'https://api.anthropic.com/v1';
const API_VERSION = '2023-06-01';

export class AnthropicProvider implements TextGenerationProvider {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(input: GenerationInput): Promise<GenerationOutput> {
    // For JSON output, append an instruction since Anthropic doesn't have a
    // dedicated response_format flag for chat (only for tool use / newer APIs).
    const userPrompt =
      input.responseFormat === 'json'
        ? `${input.userPrompt}\n\nRespond ONLY with valid JSON, no prose outside the JSON object.`
        : input.userPrompt;

    const body: Record<string, unknown> = {
      model: input.model,
      max_tokens: input.maxTokens ?? 2000,
      messages: [{ role: 'user', content: userPrompt }],
    };
    if (input.systemPrompt) body.system = input.systemPrompt;
    if (input.temperature !== undefined) body.temperature = input.temperature;

    const res = await fetch(`${BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? '';
    return {
      text,
      usage: {
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
      raw: data,
    };
  }
}
