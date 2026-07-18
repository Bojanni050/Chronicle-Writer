import { z } from 'zod';
import { FormattedContext, renderContext } from './formatter';

export const ContinuityIssueSchema = z.object({
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  relatedEntities: z.array(z.string()).optional(),
});

export const ContinuityCheckSchema = z.object({
  issues: z.array(ContinuityIssueSchema),
  overallStatus: z.enum(['clean', 'minor_issues', 'major_issues']),
  summary: z.string().optional(),
});

export type ContinuityCheckOutput = z.infer<typeof ContinuityCheckSchema>;
export type ContinuityIssue = z.infer<typeof ContinuityIssueSchema>;

export function buildContinuityPrompt(
  scene: { title: string; content_md: string },
  context: FormattedContext,
  userInstruction?: string
): { system: string; user: string } {
  const system = `You are a story continuity checker. Your job is to identify factual inconsistencies, timeline errors, character contradictions, and world-rule violations in the scene text compared to the established story context. Be precise — only flag real issues, not stylistic preferences.

Respond with valid JSON:
{
  "issues": [
    {
      "description": "string",
      "severity": "low" | "medium" | "high",
      "relatedEntities": ["string"]
    }
  ],
  "overallStatus": "clean" | "minor_issues" | "major_issues",
  "summary": "string (optional one-sentence overview)"
}

If there are no issues, return an empty issues array and "clean" status.`;

  const ctx = renderContext(context);
  const instruction = userInstruction?.trim();

  const user = `${context.sceneSection}

Story context (treat as ground truth):
${ctx || '(no story context available)'}

Scene text to check:
${scene.content_md || '(no content written yet)'}

${instruction ? `Additional focus: ${instruction}\n\n` : ''}Check for: character trait contradictions, timeline violations, world-rule inconsistencies, location errors, and plot contradictions with adjacent scenes.`;

  return { system, user };
}

export function parseContinuityOutput(text: string): ContinuityCheckOutput | null {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return ContinuityCheckSchema.parse(parsed);
  } catch {
    return null;
  }
}
