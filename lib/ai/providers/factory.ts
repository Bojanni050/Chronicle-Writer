import { TextGenerationProvider, GenerationInput, GenerationOutput, LlmProviderName } from './types';
import { OpenAiProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { OllamaProvider } from './ollama';

class StubProvider implements TextGenerationProvider {
  async generate(input: GenerationInput): Promise<GenerationOutput> {
    await new Promise((r) => setTimeout(r, 400));
    const preview = input.userPrompt.slice(0, 80);
    const text =
      input.responseFormat === 'json'
        ? JSON.stringify({ stub: true, preview })
        : `[Stub response]\n\n${preview}…`;
    return { text, usage: { inputTokens: 0, outputTokens: 0 } };
  }
}

export function getTextProvider(name?: LlmProviderName): TextGenerationProvider {
  const provider = name ?? (process.env.AI_PROVIDER as LlmProviderName | undefined) ?? 'stub';

  switch (provider) {
    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY is not set');
      return new OpenAiProvider(key);
    }
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
      return new AnthropicProvider(key);
    }
    case 'ollama':
      return new OllamaProvider(process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434');
    default:
      return new StubProvider();
  }
}
