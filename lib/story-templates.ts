import type { StoryTemplate } from '@/lib/plan-types';

export const STORY_TEMPLATES: StoryTemplate[] = [
  {
    id: 'heros-journey',
    name: "Hero's Journey",
    description: "Joseph Campbell's 12-stage mythic structure. A hero ventures from the ordinary world into a region of supernatural wonder, wins a decisive victory, then returns transformed.",
    stages: [
      { title: 'Ordinary World', summary: 'The hero\'s normal life before the adventure begins. Establish who they are, what they want, and what holds them back.' },
      { title: 'Call to Adventure', summary: 'An event, person, or problem presents the hero with a challenge or quest to undertake.' },
      { title: 'Refusal of the Call', summary: 'The hero hesitates or refuses the challenge, showing the stakes and inner resistance.' },
      { title: 'Meeting the Mentor', summary: 'The hero encounters a wise figure who gives them training, tools, or confidence for the journey.' },
      { title: 'Crossing the Threshold', summary: 'The hero commits to the journey and enters the special world, leaving the ordinary world behind.' },
      { title: 'Tests, Allies, and Enemies', summary: 'The hero faces a series of challenges, makes allies, and encounters enemies who test their resolve.' },
      { title: 'Approach to the Inmost Cave', summary: 'The hero nears the central ordeal — preparing for the greatest challenge yet.' },
      { title: 'The Ordeal', summary: 'The hero faces their greatest fear or enemy. A moment of death and rebirth — they may appear to fail before succeeding.' },
      { title: 'Reward (Seizing the Sword)', summary: 'The hero survives the ordeal and claims the reward — a treasure, knowledge, or reconciliation.' },
      { title: 'The Road Back', summary: 'The hero begins the journey home, facing the consequences of their triumph and new pursuers.' },
      { title: 'Resurrection', summary: 'The hero faces a final climactic test — a last ordeal that proves they have truly changed.' },
      { title: 'Return with the Elixir', summary: 'The hero returns home transformed, bringing something of value to the ordinary world.' },
    ],
  },
  {
    id: 'three-act',
    name: 'Three-Act Structure',
    description: 'The classic Hollywood structure: Setup, Confrontation, and Resolution. Clear turning points keep momentum and ensure a satisfying arc.',
    stages: [
      { title: 'Act 1: The Setup', summary: 'Introduce the protagonist, their world, and the central conflict. End with the inciting incident that disrupts the status quo.' },
      { title: 'Act 1: Inciting Incident', summary: 'The event that sets the story in motion — the protagonist can no longer ignore the central problem.' },
      { title: 'Act 1: Plot Point 1 (Lock-In)', summary: 'The protagonist commits to addressing the central conflict. There is no going back. End of Act 1.' },
      { title: 'Act 2A: Rising Action', summary: 'The protagonist pursues their goal, encountering obstacles and complications. Stakes escalate.' },
      { title: 'Act 2: Midpoint', summary: 'A false victory or false defeat that shifts the story\'s direction. The protagonist becomes more proactive.' },
      { title: 'Act 2B: Complications Deepen', summary: 'The situation worsens. The protagonist\'s plan falls apart. The antagonistic force tightens its grip.' },
      { title: 'Act 2: Plot Point 2 (Dark Night)', summary: 'The lowest point. All seems lost. The protagonist must dig deeper to find the will to continue.' },
      { title: 'Act 3: Climax', summary: 'The final confrontation. The protagonist uses everything they\'ve learned to face the central conflict head-on.' },
      { title: 'Act 3: Resolution', summary: 'The aftermath. Loose ends are tied up. The new normal is established and the character arc is complete.' },
    ],
  },
  {
    id: 'save-the-cat',
    name: 'Save the Cat Beat Sheet',
    description: "Blake Snyder's 15-beat screenwriting structure, adapted for fiction. Highly specific story beats with act percentages.",
    stages: [
      { title: 'Opening Image', summary: 'A visual that represents the mood, tone, and starting state of the protagonist before change begins.' },
      { title: 'Theme Stated', summary: 'Someone — often not the protagonist — states the theme of the story as a question or challenge.' },
      { title: 'Set-Up', summary: 'Introduce the protagonist\'s world: what they want, what they need, and what flaws they must overcome.' },
      { title: 'Catalyst', summary: 'The inciting incident — the moment that upsets the status quo and sets the story in motion.' },
      { title: 'Debate', summary: 'The protagonist questions whether to take the leap. Internal conflict, weighing options.' },
      { title: 'Break into Two', summary: 'The protagonist makes an active choice that pushes them into the second act. A new world begins.' },
      { title: 'B Story', summary: 'A secondary story (often romantic or mentorship) that carries the theme and provides relief from the A story.' },
      { title: 'Fun and Games', summary: 'The promise of the premise — the most entertaining, engaging part of the story. The protagonist explores the new world.' },
      { title: 'Midpoint', summary: 'A false victory or false defeat. Stakes are raised. The fun-and-games era ends; real trouble begins.' },
      { title: 'Bad Guys Close In', summary: 'The protagonist\'s external and internal problems worsen. The team or plan starts falling apart.' },
      { title: 'All Is Lost', summary: 'The worst moment yet. A whiff of death — literal or metaphorical. The protagonist has never been lower.' },
      { title: 'Dark Night of the Soul', summary: 'The protagonist sits with their despair. Where did I go wrong? What should I do? The break before the breakthrough.' },
      { title: 'Break into Three', summary: 'The protagonist finds the answer — often by combining the A and B story lessons — and acts.' },
      { title: 'Finale', summary: 'The protagonist executes the new plan, confronts the antagonist, and proves they have changed. The world is transformed.' },
      { title: 'Final Image', summary: 'A mirror of the opening image — showing how much the world and protagonist have changed.' },
    ],
  },
  {
    id: 'five-act',
    name: 'Five-Act Structure',
    description: "Shakespeare's classical dramatic structure. Five distinct acts build through rising action, a climax, and falling action toward resolution.",
    stages: [
      { title: 'Act 1: Exposition', summary: 'Introduce the characters, setting, and central conflict. Establish the status quo and what will disrupt it.' },
      { title: 'Act 2: Rising Action', summary: 'Events that build tension and complicate the protagonist\'s situation. Alliances, betrayals, and escalating stakes.' },
      { title: 'Act 3: Climax', summary: 'The turning point of the story — the moment of highest tension where the outcome is still uncertain.' },
      { title: 'Act 4: Falling Action', summary: 'The aftermath of the climax. Loose threads are pulled, consequences unfold, the antagonist\'s power wanes.' },
      { title: 'Act 5: Denouement', summary: 'Resolution and catharsis. The final state of the world is established and the protagonist\'s transformation is complete.' },
    ],
  },
  {
    id: 'story-circle',
    name: "Dan Harmon's Story Circle",
    description: "Dan Harmon's simplified version of the hero's journey, structured as a circle. Eight steps emphasizing character need and transformation.",
    stages: [
      { title: '1. You — Establish the Status Quo', summary: 'Introduce the protagonist in their comfort zone. Who are they? What is their ordinary world like?' },
      { title: '2. Need — Desire or Problem', summary: 'The protagonist needs something — consciously or unconsciously. This need drives every subsequent step.' },
      { title: '3. Go — Cross the Threshold', summary: 'The protagonist leaves their comfort zone and enters an unfamiliar situation in pursuit of their need.' },
      { title: '4. Search — Adapt and Struggle', summary: 'The protagonist tries to get what they need in the new situation, adapting and struggling.' },
      { title: '5. Find — Achieve the Goal', summary: 'The protagonist gets what they wanted — but at a cost. A moment of victory, discovery, or climax.' },
      { title: '6. Take — Pay the Price', summary: 'The protagonist pays for their achievement. Something is lost, a price is extracted, consequences arrive.' },
      { title: '7. Return — Come Back Changed', summary: 'The protagonist returns to their familiar world, but everything is different because they are different.' },
      { title: '8. Change — Apply the Lesson', summary: 'The protagonist has changed. They apply what they\'ve learned to their original situation, closing the circle.' },
    ],
  },
];

export function getTemplate(id: string): StoryTemplate | undefined {
  return STORY_TEMPLATES.find((t) => t.id === id);
}
