import { z } from 'zod';
import { FormattedContext, renderContext } from './formatter';

export const RewriteSchema = z.object({
  rewrittenText: z.string(),
  notes: z.string().optional(),
});

export type RewriteOutput = z.infer<typeof RewriteSchema>;

export function buildRewritePrompt(
  scene: { title: string; content_md: string },
  context: FormattedContext,
  userInstruction?: string
): { system: string; user: string } {
  const system = `You are a fiction editor improving existing prose. Rewrite exactly the text provided — do not add plot events or character details not already present. Preserve the author's voice while improving clarity, pacing, and rhythm.

Respond with valid JSON:
{
  "rewrittenText": "string",
  "notes": "string (optional brief editorial notes)"
}`;

  const ctx = renderContext(context);
  const instruction = userInstruction?.trim() || 'Improve pacing, clarity, and voice. Keep the author\'s style.';

  const user = `${context.sceneSection}

${ctx ? `Context:\n${ctx}\n\n` : ''}Original text to rewrite:
${scene.content_md || '(no content yet — write a first pass based on the scene brief)'}

Rewrite instruction: ${instruction}`;

  return { system, user };
}

export function parseRewriteOutput(text: string): RewriteOutput | null {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return RewriteSchema.parse(parsed);
  } catch {
    // Fallback: treat the entire text as the rewritten prose.
    return { rewrittenText: text.trim() };
  }
}
