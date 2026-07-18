import { AiProvider, AiModel, callAi } from './provider';

export type TaskType = 'brainstorm' | 'draft' | 'rewrite' | 'continuity_check';

export interface ContextManifest {
  sceneId?: string;
  sceneTitle?: string;
  sceneBrief?: { pov: string; goal: string; conflict: string; emotion: string };
  nearbyScenes?: Array<{ id: string; title: string; summary: string }>;
  pinnedCharacters?: Array<{ id: string; name: string; role: string }>;
  pinnedLocations?: Array<{ id: string; name: string }>;
  styleGuideTone?: string;
  existingContent?: string;
}

export interface AiTaskInput {
  taskType: TaskType;
  context: ContextManifest;
  userInstruction?: string;
  provider?: AiProvider;
  model?: AiModel;
}

export interface AiTaskResult {
  outputText: string;
  provider: AiProvider;
  model: AiModel;
  promptText: string;
  contextManifestJson: ContextManifest;
}

function buildPrompt(input: AiTaskInput): { system: string; user: string } {
  const { taskType, context, userInstruction } = input;
  const { sceneBrief, sceneTitle, existingContent } = context;

  const briefStr = sceneBrief
    ? `POV: ${sceneBrief.pov}\nGoal: ${sceneBrief.goal}\nConflict: ${sceneBrief.conflict}\nEmotion: ${sceneBrief.emotion}`
    : '';

  switch (taskType) {
    case 'brainstorm':
      return {
        system: 'You are a creative fiction writing assistant helping an author brainstorm ideas.',
        user: `Scene: "${sceneTitle}"\n${briefStr}\n\n${userInstruction || 'Generate 5 creative directions for this scene.'}`,
      };
    case 'draft':
      return {
        system: 'You are a skilled fiction writer. Write compelling, vivid prose.',
        user: `Write a first draft of the scene "${sceneTitle}".\n${briefStr}\n\n${userInstruction || ''}`,
      };
    case 'rewrite':
      return {
        system: 'You are a fiction editor improving existing prose.',
        user: `Rewrite the following scene excerpt.\n\nOriginal:\n${existingContent || ''}\n\n${userInstruction || 'Improve clarity, pacing, and voice.'}`,
      };
    case 'continuity_check':
      return {
        system: 'You are a continuity checker for fiction. Identify inconsistencies.',
        user: `Check continuity for scene "${sceneTitle}".\n${briefStr}\n\nContent:\n${existingContent || ''}\n\n${userInstruction || 'List any continuity issues.'}`,
      };
  }
}

export async function runAiTask(input: AiTaskInput): Promise<AiTaskResult> {
  const provider = input.provider ?? 'stub';
  const model = input.model ?? 'stub';
  const { system, user } = buildPrompt(input);

  const result = await callAi({ provider, model, systemPrompt: system, userPrompt: user });

  return {
    outputText: result.text,
    provider,
    model,
    promptText: `SYSTEM:\n${system}\n\nUSER:\n${user}`,
    contextManifestJson: input.context,
  };
}
