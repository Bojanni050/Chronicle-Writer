export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
  model: string;
}

interface PricingEntry {
  inputPer1k: number;
  outputPer1k: number;
}

// Prices in USD per 1 000 tokens (as of mid-2025)
const PRICING: Record<string, PricingEntry> = {
  'gpt-4o':                      { inputPer1k: 0.0025,  outputPer1k: 0.01 },
  'gpt-4o-mini':                 { inputPer1k: 0.00015, outputPer1k: 0.0006 },
  'gpt-4-turbo':                 { inputPer1k: 0.01,    outputPer1k: 0.03 },
  'gpt-3.5-turbo':               { inputPer1k: 0.0005,  outputPer1k: 0.0015 },
  'claude-3-5-sonnet-20241022':  { inputPer1k: 0.003,   outputPer1k: 0.015 },
  'claude-3-5-haiku-20241022':   { inputPer1k: 0.0008,  outputPer1k: 0.004 },
  'claude-3-opus-20240229':      { inputPer1k: 0.015,   outputPer1k: 0.075 },
};

// Fallback for unknown models / local Ollama — treat as free
const ZERO: PricingEntry = { inputPer1k: 0, outputPer1k: 0 };

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): CostEstimate {
  const pricing = PRICING[model] ?? ZERO;
  const inputCostUsd  = (inputTokens  / 1000) * pricing.inputPer1k;
  const outputCostUsd = (outputTokens / 1000) * pricing.outputPer1k;
  return {
    inputTokens,
    outputTokens,
    inputCostUsd,
    outputCostUsd,
    totalCostUsd: inputCostUsd + outputCostUsd,
    model,
  };
}

export function formatCost(estimate: CostEstimate): string {
  const total = estimate.totalCostUsd;
  if (total === 0) return '$0.00';
  if (total < 0.0001) return `<$0.0001`;
  return `$${total.toFixed(4)}`;
}
