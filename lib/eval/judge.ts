import { z } from 'zod';
import { getTextProvider } from '@/lib/ai/providers/factory';
import type { Rubric, JudgeVerdict } from './schema';
import { buildVerdict } from './scoring';

const JudgeResponseSchema = z.object({
  scores: z.record(z.number()),
  reasonings: z.record(z.string()).optional(),
  overallReasoning: z.string().optional(),
});

function buildJudgePrompt(rubric: Rubric, taskOutput: string, caseInput: string): string {
  const dimList = rubric.dimensions
    .map((d) => `  - ${d.key} (weight ${d.weight}): ${d.description}`)
    .join('\n');

  return `You are an impartial evaluator judging the quality of AI-generated writing assistant output.

Task type: ${rubric.taskType}
Pass threshold: ${rubric.passThreshold} (weighted average across dimensions)

Evaluation dimensions:
${dimList}

Score each dimension from 0.0 to 1.0. Be objective — a score of 0.5 means adequate but imperfect.

--- INPUT PROVIDED TO THE AI ---
${caseInput.slice(0, 2000)}

--- AI OUTPUT TO EVALUATE ---
${taskOutput.slice(0, 3000)}

Respond ONLY with JSON:
{
  "scores": { ${rubric.dimensions.map((d) => `"${d.key}": <0.0–1.0>`).join(', ')} },
  "reasonings": { ${rubric.dimensions.map((d) => `"${d.key}": "<brief reason>"`).join(', ')} },
  "overallReasoning": "<one sentence summary>"
}`;
}

export async function runJudge(
  rubric: Rubric,
  taskOutput: string,
  caseInputSummary: string
): Promise<JudgeVerdict> {
  const provider = getTextProvider();
  const judgeModel = process.env.JUDGE_MODEL ?? process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini';

  let verdict: JudgeVerdict;
  try {
    const result = await provider.generate({
      userPrompt: buildJudgePrompt(rubric, taskOutput, caseInputSummary),
      model: judgeModel,
      temperature: 0.1,
      maxTokens: 800,
      responseFormat: 'json',
    });

    const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JudgeResponseSchema.parse(JSON.parse(cleaned));

    verdict = buildVerdict(rubric, parsed.scores, parsed.reasonings ?? {});
    verdict = { ...verdict, reasoning: parsed.overallReasoning ?? '' };
  } catch {
    // Judge call failed — assign zero scores, mark as failed
    verdict = buildVerdict(rubric, {});
    verdict = { ...verdict, reasoning: 'Judge call failed — scores defaulted to 0' };
  }

  return verdict;
}
