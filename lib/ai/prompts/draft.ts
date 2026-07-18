import { FormattedContext, renderContext } from './formatter';

export function buildDraftPrompt(
  scene: { title: string },
  context: FormattedContext,
  userInstruction?: string
): { system: string; user: string } {
  const system = `You are a skilled fiction writer crafting a first draft. Write vivid, purposeful prose that serves the scene's goal and emotional arc. Honour all established characters, locations, and world details from the provided context — never invent facts that contradict them.

Write only the scene prose. No meta-commentary, no explanations, no headers.`;

  const ctx = renderContext(context);
  const instruction = userInstruction?.trim();

  const user = `${context.sceneSection}

${ctx ? `Story context:\n${ctx}\n\n` : ''}Write a first draft of this scene.${instruction ? `\n\nExtra instruction: ${instruction}` : ''}

Write immersive, scene-level prose. Use the scene brief as your guide for what must happen. Keep the POV character's voice distinct.`;

  return { system, user };
}
