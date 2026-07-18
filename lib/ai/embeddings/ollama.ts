import { EmbeddingProvider } from './types';

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 768; // nomic-embed-text outputs 768-dim vectors
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(baseUrl: string, model = 'nomic-embed-text') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Ollama embeddings API handles one text at a time; fan out in parallel.
    return Promise.all(
      texts.map(async (text) => {
        const res = await fetch(`${this.baseUrl}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: this.model, prompt: text }),
        });
        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Ollama embeddings error ${res.status}: ${err}`);
        }
        const data = await res.json();
        return data.embedding as number[];
      })
    );
  }
}
