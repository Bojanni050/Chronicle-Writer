import { EmbeddingProvider } from './types';

const BASE = 'https://api.openai.com/v1';

export class OpenAiEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 1536;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = 'text-embedding-3-small') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const res = await fetch(`${BASE}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, input: texts }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI embeddings error ${res.status}: ${err}`);
    }

    const data = await res.json();
    // data.data is sorted by index field to match input order
    return (data.data as Array<{ index: number; embedding: number[] }>)
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }
}
