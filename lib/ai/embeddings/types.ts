export interface EmbeddingProvider {
  /** Returns one float array per input string. Same order as input. */
  embed(texts: string[]): Promise<number[][]>;
  /** Dimensionality of the output vectors. */
  readonly dimensions: number;
}

export type EmbeddingProviderName = 'openai' | 'ollama' | 'stub';
