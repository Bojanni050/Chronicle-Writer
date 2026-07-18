import { EmbeddingProvider, EmbeddingProviderName } from './types';
import { OpenAiEmbeddingProvider } from './openai';
import { OllamaEmbeddingProvider } from './ollama';

class StubEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 1536;
  async embed(texts: string[]): Promise<number[][]> {
    // Returns zeroed-out vectors — usable for schema testing, no real retrieval.
    return texts.map(() => Array(this.dimensions).fill(0) as number[]);
  }
}

let _provider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(name?: EmbeddingProviderName): EmbeddingProvider {
  // Reuse the singleton per process (safe: providers are stateless).
  if (_provider) return _provider;

  const providerName =
    name ?? (process.env.EMBEDDING_PROVIDER as EmbeddingProviderName | undefined) ?? 'stub';

  switch (providerName) {
    case 'openai': {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error('OPENAI_API_KEY is not set');
      const model = process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small';
      _provider = new OpenAiEmbeddingProvider(key, model);
      break;
    }
    case 'ollama': {
      const base = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
      const model = process.env.OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text';
      _provider = new OllamaEmbeddingProvider(base, model);
      break;
    }
    default:
      _provider = new StubEmbeddingProvider();
  }

  return _provider;
}

export function isEmbeddingEnabled(): boolean {
  const p = process.env.EMBEDDING_PROVIDER ?? 'stub';
  return p !== 'stub';
}
