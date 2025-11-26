import { Framework } from './types';

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
  },
];

export function getFrameworkById(id: string): Framework | undefined {
  return frameworks.find((f) => f.id === id);
}

export function generatePrompt(frameworkId: string, data: Record<string, string>): string {
  switch (frameworkId) {
    case 'tot':
      return `You are a ${data.role}.

Your objective: ${data.objective}

Please generate ${data.approaches} different approaches to solve this problem. For each approach:
1. Describe the reasoning path
2. Evaluate it based on these criteria: ${data.criteria}
3. Identify strengths and weaknesses

After presenting all approaches, recommend the best one and explain why.`;

    case 'self-consistency':
      return `You are a ${data.role}.

Goal: ${data.goal}

Please provide ${data.versions} independent reasoning paths to answer this question. For each version:
1. Show your complete reasoning process
2. State your conclusion

After all versions, identify the most consistent answer and explain why it's the most reliable.`;

    case 'cot':
      return `You are a ${data.role}.

Problem: ${data.problem}
${data.context ? `\nContext: ${data.context}` : ''}

Please solve this problem step by step:
1. Break down the problem into smaller parts
2. Solve each part systematically
3. Show your reasoning at each step
4. Arrive at a final answer
5. Verify your solution`;

    case 'role':
      return `You are a ${data.role}.

Tone/Style: ${data.tone}

Task: ${data.task}
${data.examples ? `\nExamples:\n${data.examples}` : ''}

Please complete this task following the tone and style demonstrated above.`;

    case 'reflection':
      return `You are a ${data.role}.

Task: ${data.task}

Step 1: Create an initial version
First, produce your initial response to the task above.

Step 2: Critical reflection
Review your initial response and identify areas for improvement based on these criteria:
${data.criteria}

Step 3: Revised version
Produce an improved version that addresses the issues identified in your reflection.`;

    default:
      return 'Invalid framework type';
  }
}
