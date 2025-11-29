export interface TreeOfThoughtData {
  role: string;
  objective: string;
  approaches: string;
  criteria: string;
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

export type PromptGeneratorFn = (data: FrameworkData) => string;

function validateTreeOfThought(data: Record<string, string>): TreeOfThoughtData {
  const { role, objective, approaches, criteria } = data;
  if (!role || !objective || !approaches || !criteria) {
    throw new Error('Missing required fields for Tree-of-Thought framework');
  }
  return { role, objective, approaches, criteria };
}

function validateSelfConsistency(data: Record<string, string>): SelfConsistencyData {
  const { role, goal, versions } = data;
  if (!role || !goal || !versions) {
    throw new Error('Missing required fields for Self-Consistency framework');
  }
  return { role, goal, versions };
}

function validateChainOfThought(data: Record<string, string>): ChainOfThoughtData {
  const { role, problem, context } = data;
  if (!role || !problem) {
    throw new Error('Missing required fields for Chain-of-Thought framework');
  }
  return { role, problem, context };
}

function validateRolePrompting(data: Record<string, string>): RolePromptingData {
  const { role, tone, task, examples } = data;
  if (!role || !tone || !task) {
    throw new Error('Missing required fields for Role Prompting framework');
  }
  return { role, tone, task, examples };
}

function validateReflection(data: Record<string, string>): ReflectionData {
  const { role, task, criteria } = data;
  if (!role || !task || !criteria) {
    throw new Error('Missing required fields for Reflection framework');
  }
  return { role, task, criteria };
}

function generateTreeOfThought(data: FrameworkData): string {
  const d = data as TreeOfThoughtData;
  return `You are a ${d.role}.

Your objective: ${d.objective}

Please generate ${d.approaches} different approaches to solve this problem. For each approach:
1. Describe the reasoning path
2. Evaluate it based on these criteria: ${d.criteria}
3. Identify strengths and weaknesses

After presenting all approaches, recommend the best one and explain why.`;
}

function generateSelfConsistency(data: FrameworkData): string {
  const d = data as SelfConsistencyData;
  return `You are a ${d.role}.

Goal: ${d.goal}

Please provide ${d.versions} independent reasoning paths to answer this question. For each version:
1. Show your complete reasoning process
2. State your conclusion

After all versions, identify the most consistent answer and explain why it's the most reliable.`;
}

function generateChainOfThought(data: FrameworkData): string {
  const d = data as ChainOfThoughtData;
  return `You are a ${d.role}.

Problem: ${d.problem}
${d.context ? `\nContext: ${d.context}` : ''}

Please solve this problem step by step:
1. Break down the problem into smaller parts
2. Solve each part systematically
3. Show your reasoning at each step
4. Arrive at a final answer
5. Verify your solution`;
}

function generateRolePrompting(data: FrameworkData): string {
  const d = data as RolePromptingData;
  return `You are a ${d.role}.

Tone/Style: ${d.tone}

Task: ${d.task}
${d.examples ? `\nExamples:\n${d.examples}` : ''}

Please complete this task following the tone and style demonstrated above.`;
}

function generateReflection(data: FrameworkData): string {
  const d = data as ReflectionData;
  return `You are a ${d.role}.

Task: ${d.task}

Step 1: Create an initial version
First, produce your initial response to the task above.

Step 2: Critical reflection
Review your initial response and identify areas for improvement based on these criteria:
${d.criteria}

Step 3: Revised version
Produce an improved version that addresses the issues identified in your reflection.`;
}

type ValidatorFn = (data: Record<string, string>) => FrameworkData;

const validators: Record<string, ValidatorFn> = {
  tot: validateTreeOfThought,
  'self-consistency': validateSelfConsistency,
  cot: validateChainOfThought,
  role: validateRolePrompting,
  reflection: validateReflection,
};

const generators: Record<string, PromptGeneratorFn> = {
  tot: generateTreeOfThought,
  'self-consistency': generateSelfConsistency,
  cot: generateChainOfThought,
  role: generateRolePrompting,
  reflection: generateReflection,
};

export function getPromptGenerator(frameworkId: string): PromptGeneratorFn | undefined {
  return generators[frameworkId];
}

export function validateAndGenerate(frameworkId: string, data: Record<string, string>): string {
  const validator = validators[frameworkId];
  const generator = generators[frameworkId];

  if (!validator || !generator) {
    throw new Error(`Invalid framework type: ${frameworkId}`);
  }

  const validatedData = validator(data);
  return generator(validatedData);
}
