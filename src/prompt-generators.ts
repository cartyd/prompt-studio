export interface TreeOfThoughtData {
  role: string;
  objective: string;
  approaches: string;
  criteria: string | string[];
}

export interface SelfConsistencyData {
  role: string;
  goal: string;
  versions: string;
}

export interface ChainOfThoughtData {
  role: string;
  problem: string;
  context?: string;
}

export interface RolePromptingData {
  role: string;
  tone: string;
  task: string;
  examples?: string;
}

export interface ReflectionData {
  role: string;
  task: string;
  criteria: string;
}

export type FrameworkData =
  | TreeOfThoughtData
  | SelfConsistencyData
  | ChainOfThoughtData
  | RolePromptingData
  | ReflectionData;

function validateTreeOfThought(data: Record<string, string | string[]>): TreeOfThoughtData {
  const { role, objective, approaches, criteria } = data;
  if (!role || !objective || !approaches || !criteria) {
    throw new Error('Missing required fields for Tree-of-Thought framework');
  }
  // Handle both string and array formats
  const criteriaValue = Array.isArray(criteria) ? criteria : criteria;
  return { role: role as string, objective: objective as string, approaches: approaches as string, criteria: criteriaValue };
}

function validateSelfConsistency(data: Record<string, string | string[]>): SelfConsistencyData {
  const { role, goal, versions } = data;
  if (!role || !goal || !versions) {
    throw new Error('Missing required fields for Self-Consistency framework');
  }
  return { role: role as string, goal: goal as string, versions: versions as string };
}

function validateChainOfThought(data: Record<string, string | string[]>): ChainOfThoughtData {
  const { role, problem, context } = data;
  if (!role || !problem) {
    throw new Error('Missing required fields for Chain-of-Thought framework');
  }
  return { role: role as string, problem: problem as string, context: context as string | undefined };
}

function validateRolePrompting(data: Record<string, string | string[]>): RolePromptingData {
  const { role, tone, task, examples } = data;
  if (!role || !tone || !task) {
    throw new Error('Missing required fields for Role Prompting framework');
  }
  return { role: role as string, tone: tone as string, task: task as string, examples: examples as string | undefined };
}

function validateReflection(data: Record<string, string | string[]>): ReflectionData {
  const { role, task, criteria } = data;
  if (!role || !task || !criteria) {
    throw new Error('Missing required fields for Reflection framework');
  }
  return { role: role as string, task: task as string, criteria: criteria as string };
}

function generateTreeOfThought(data: TreeOfThoughtData): string {
  // Format criteria as numbered list
  const criteriaText = Array.isArray(data.criteria)
    ? data.criteria.map((c, i) => `(${i + 1}) ${c}`).join(', ')
    : data.criteria;

  return `You are a ${data.role}.

Your objective: ${data.objective}

Please generate ${data.approaches} different approaches to solve this problem. For each approach:
1. Describe the reasoning path
2. Evaluate it based on these criteria: ${criteriaText}
3. Identify strengths and weaknesses

After presenting all approaches, recommend the best one and explain why.`;
}

function generateSelfConsistency(data: SelfConsistencyData): string {
  return `You are a ${data.role}.

Goal: ${data.goal}

Please provide ${data.versions} independent reasoning paths to answer this question. For each version:
1. Show your complete reasoning process
2. State your conclusion

After all versions, identify the most consistent answer and explain why it's the most reliable.`;
}

function generateChainOfThought(data: ChainOfThoughtData): string {
  return `You are a ${data.role}.

Problem: ${data.problem}
${data.context ? `\nContext: ${data.context}` : ''}

Please solve this problem step by step:
1. Break down the problem into smaller parts
2. Solve each part systematically
3. Show your reasoning at each step
4. Arrive at a final answer
5. Verify your solution`;
}

function generateRolePrompting(data: RolePromptingData): string {
  return `You are a ${data.role}.

Tone/Style: ${data.tone}

Task: ${data.task}
${data.examples ? `\nExamples:\n${data.examples}` : ''}

Please complete this task following the tone and style demonstrated above.`;
}

function generateReflection(data: ReflectionData): string {
  return `You are a ${data.role}.

Task: ${data.task}

Step 1: Create an initial version
First, produce your initial response to the task above.

Step 2: Critical reflection
Review your initial response and identify areas for improvement based on these criteria:
${data.criteria}

Step 3: Revised version
Produce an improved version that addresses the issues identified in your reflection.`;
}

interface ValidatorGeneratorPair<T extends FrameworkData> {
  validator: (data: Record<string, string | string[]>) => T;
  generator: (data: T) => string;
}

const frameworkHandlers: Record<string, ValidatorGeneratorPair<any>> = {
  tot: {
    validator: validateTreeOfThought,
    generator: generateTreeOfThought,
  },
  'self-consistency': {
    validator: validateSelfConsistency,
    generator: generateSelfConsistency,
  },
  cot: {
    validator: validateChainOfThought,
    generator: generateChainOfThought,
  },
  role: {
    validator: validateRolePrompting,
    generator: generateRolePrompting,
  },
  reflection: {
    validator: validateReflection,
    generator: generateReflection,
  },
};

export function validateAndGenerate(frameworkId: string, data: Record<string, string | string[]>): string {
  const handler = frameworkHandlers[frameworkId];

  if (!handler) {
    throw new Error(`Invalid framework type: ${frameworkId}`);
  }

  const validatedData = handler.validator(data);
  return handler.generator(validatedData);
}
