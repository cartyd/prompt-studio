import { Framework } from './types';
import { validateAndGenerate } from './prompt-generators';

export const frameworks: Framework[] = [
  {
    id: 'tot',
    name: 'Tree-of-Thought (ToT)',
    description: 'Explore multiple reasoning paths and evaluate approaches to find the best solution.',
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., expert problem solver', required: true },
      { name: 'objective', label: 'Objective', type: 'textarea', placeholder: 'What problem needs to be solved?', required: true },
      { name: 'approaches', label: 'Number of Approaches', type: 'number', placeholder: '3', required: true },
      { name: 'criteria', label: 'Evaluation Criteria', type: 'textarea', placeholder: 'How should approaches be evaluated?', required: true },
    ],
    example: {
      role: 'career counselor',
      objective: 'Help me decide whether to accept a job offer in a new city or stay in my current position with a promotion opportunity',
      approaches: '3',
      criteria: 'Quality of life, career growth potential, financial impact, personal relationships, and long-term happiness',
    },
  },
  {
    id: 'self-consistency',
    name: 'Self-Consistency',
    description: 'Generate multiple reasoning paths and select the most consistent answer.',
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., analytical reasoner', required: true },
      { name: 'goal', label: 'Goal', type: 'textarea', placeholder: 'What question needs to be answered?', required: true },
      { name: 'versions', label: 'Number of Versions', type: 'number', placeholder: '3', required: true },
    ],
    example: {
      role: 'financial advisor',
      goal: 'Should I pay off my student loans aggressively or invest that money in a retirement account?',
      versions: '3',
    },
  },
  {
    id: 'cot',
    name: 'Chain-of-Thought (CoT)',
    description: 'Break down complex problems into step-by-step reasoning.',
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., logical thinker', required: true },
      { name: 'problem', label: 'Problem', type: 'textarea', placeholder: 'Describe the problem to solve', required: true },
      { name: 'context', label: 'Context', type: 'textarea', placeholder: 'Any relevant background information', required: false },
    ],
    example: {
      role: 'time management coach',
      problem: 'I have 8 hours available this weekend. I need to: prepare a presentation (3-4 hours), exercise (1 hour), grocery shop (1 hour), and spend quality time with family (at least 3 hours). How can I fit everything in?',
      context: 'The presentation is due Monday morning. The grocery store closes at 8pm on weekends. Family time is most important to me.',
    },
  },
  {
    id: 'role',
    name: 'Few-Shot / Role Prompting',
    description: 'Provide examples and define a specific role for the AI to embody.',
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., professional copywriter', required: true },
      { name: 'tone', label: 'Tone Sample', type: 'textarea', placeholder: 'Example of desired tone/style', required: true },
      { name: 'task', label: 'Task', type: 'textarea', placeholder: 'What should be produced?', required: true },
      { name: 'examples', label: 'Examples', type: 'textarea', placeholder: 'Provide 2-3 examples', required: false },
    ],
    example: {
      role: 'children\'s book author',
      tone: 'Playful, imaginative, uses simple language with rhythm and repetition',
      task: 'Write the opening paragraph of a story about a child who discovers their pet can talk',
      examples: 'Example 1: "Lily loved her cat, but her cat did not talk. Until one day... it did!"\n\nExample 2: "Max had a secret. A big, big secret. His hamster knew magic words."',
    },
  },
  {
    id: 'reflection',
    name: 'Reflection / Revision',
    description: 'Generate an initial response, then critically evaluate and improve it.',
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., critical editor', required: true },
      { name: 'task', label: 'Task', type: 'textarea', placeholder: 'What needs to be created?', required: true },
      { name: 'criteria', label: 'Revision Criteria', type: 'textarea', placeholder: 'What should be improved?', required: true },
    ],
    example: {
      role: 'wedding speech coach',
      task: 'Write a best man speech for my brother\'s wedding',
      criteria: 'Appropriate humor, emotional depth, good pacing, includes specific memories, ends with a meaningful toast',
    },
  },
];

export function getFrameworkById(id: string): Framework | undefined {
  return frameworks.find((f) => f.id === id);
}

export function generatePrompt(frameworkId: string, data: Record<string, string>): string {
  try {
    return validateAndGenerate(frameworkId, data);
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid framework type';
  }
}
