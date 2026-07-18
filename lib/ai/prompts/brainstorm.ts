import { z } from 'zod';
import { FormattedContext, renderContext } from './formatter';

export const BrainstormSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
  risks: z.array(z.string()).optional(),
  recommendedDirection: z.string().optional(),
});

export type BrainstormOutput = z.infer<typeof BrainstormSchema>;

export function buildBrainstormPrompt(
  scene: { title: string },
  context: FormattedContext,
  userInstruction?: string
): { system: string; user: string } {
  const system = `You are a creative fiction writing assistant. Your role is to help authors develop their scenes while respecting the established story world and characters. Never contradict the provided context — treat it as canon.

Always respond with valid JSON matching this schema:
{
  "suggestions": [{"title": "string", "description": "string"}],
  "risks": ["string"],
  "recommendedDirection": "string"
}`;

  const ctx = renderContext(context);
  const instruction = userInstruction?.trim() || 'Generate 5 creative directions for this scene, each distinct in approach and mood.';

  const user = `${context.sceneSection}

${ctx ? `Context:\n${ctx}\n\n` : ''}Task: ${instruction}

Respond with 5 concrete suggestions. Each suggestion needs a short title and a 2-3 sentence description of how to approach the scene. Include optional risks (potential pitfalls) and your recommended direction.`;

  return { system, user };
}

export function parseBrainstormOutput(text: string): BrainstormOutput | null {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return BrainstormSchema.parse(parsed);
  } catch {
    return null;
  }
}
