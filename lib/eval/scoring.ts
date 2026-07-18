import type { Rubric, DimensionScore, JudgeVerdict } from './schema';

export function computeWeightedScore(scores: DimensionScore[]): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = scores.reduce((sum, s) => sum + s.score * s.weight, 0);
  return weighted / totalWeight;
}

export function buildVerdict(
  rubric: Rubric,
  dimensionScores: Record<string, number>,
  reasonings: Record<string, string> = {}
): JudgeVerdict {
  const dimensions: DimensionScore[] = rubric.dimensions.map((dim) => {
    const raw = dimensionScores[dim.key] ?? 0;
    const clamped = Math.max(dim.min, Math.min(dim.max, raw));
    return {
      key: dim.key,
      label: dim.label,
      score: clamped,
      weight: dim.weight,
      reasoning: reasonings[dim.key] ?? '',
    };
  });

  const totalScore = computeWeightedScore(dimensions);
  const passed = totalScore >= rubric.passThreshold;

  return { dimensions, totalScore, passed, reasoning: '' };
}

export function summariseRun(verdicts: JudgeVerdict[]): {
  meanScore: number;
  passRate: number;
  passedCount: number;
  totalCount: number;
} {
  if (verdicts.length === 0) {
    return { meanScore: 0, passRate: 0, passedCount: 0, totalCount: 0 };
  }
  const passed = verdicts.filter((v) => v.passed).length;
  const mean = verdicts.reduce((s, v) => s + v.totalScore, 0) / verdicts.length;
  return {
    meanScore: mean,
    passRate: passed / verdicts.length,
    passedCount: passed,
    totalCount: verdicts.length,
  };
}
