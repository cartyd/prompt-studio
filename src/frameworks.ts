import { Framework, DEFAULT_EVALUATION_CRITERIA } from './types';
import { validateAndGenerate } from './prompt-generators';
import { totTemplates, selfConsistencyTemplates, cotTemplates, roleTemplates, reflectionTemplates } from './templates';
import { 
  totExamples, 
  selfConsistencyExamples, 
  cotExamples, 
  roleExamples, 
  reflectionExamples 
} from './framework-examples';
import { LIMITS } from './constants/scoring';
import { CommonFields, FieldBuilder } from './utils/field-builder';

export const frameworks: Framework[] = [
  {
    id: 'tot',
    name: 'Tree-of-Thought (ToT)',
    description: 'Explore multiple reasoning paths and evaluate approaches to find the best solution.',
    templates: totTemplates,
    fields: [
      CommonFields.role('expert problem solver'),
      CommonFields.objective(),
      CommonFields.approaches(String(LIMITS.DEFAULT_APPROACHES)),
      FieldBuilder.multiSelect('criteria', 'Evaluation Criteria')
        .placeholder('Select or add criteria')
        .required()
        .options([...DEFAULT_EVALUATION_CRITERIA])
        .defaultValue(['Accuracy/Correctness', 'Feasibility/Practicality', 'Completeness/Thoroughness', 'Clarity/Coherence'])
        .build(),
    ],
    examples: totExamples,
  },
  {
    id: 'self-consistency',
    name: 'Self-Consistency',
    description: 'Generate multiple reasoning paths and select the most consistent answer.',
    templates: selfConsistencyTemplates,
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., analytical reasoner', required: true, defaultValue: 'analytical reasoner' },
      { name: 'goal', label: 'Goal', type: 'textarea', placeholder: 'What question needs to be answered?', required: true },
      { name: 'versions', label: 'Number of Versions', type: 'number', placeholder: '3', required: true, defaultValue: String(LIMITS.DEFAULT_VERSIONS) },
    ],
    examples: selfConsistencyExamples,
  },
  {
    id: 'cot',
    name: 'Chain-of-Thought (CoT)',
    description: 'Break down complex problems into step-by-step reasoning.',
    templates: cotTemplates,
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., logical thinker', required: true, defaultValue: 'logical thinker' },
      { name: 'problem', label: 'Problem', type: 'textarea', placeholder: 'Describe the problem to solve', required: true },
      { name: 'context', label: 'Context', type: 'textarea', placeholder: 'Any relevant background information', required: false, optional: true },
    ],
    examples: cotExamples,
  },
  {
    id: 'role',
    name: 'Few-Shot / Role Prompting',
    description: 'Provide examples and define a specific role for the AI to embody.',
    templates: roleTemplates,
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., professional copywriter', required: true, defaultValue: 'professional copywriter' },
      { name: 'tone', label: 'Tone Sample', type: 'textarea', placeholder: 'Example of desired tone/style', required: true },
      { name: 'task', label: 'Task', type: 'textarea', placeholder: 'What should be produced?', required: true },
      { name: 'examples', label: 'Examples', type: 'textarea', placeholder: 'Provide 2-3 examples', required: false, optional: true },
    ],
    examples: roleExamples,
  },
  {
    id: 'reflection',
    name: 'Reflection / Revision',
    description: 'Generate an initial response, then critically evaluate and improve it.',
    templates: reflectionTemplates,
    fields: [
      { name: 'role', label: 'Role', type: 'text', placeholder: 'e.g., critical editor', required: true, defaultValue: 'critical editor' },
      { name: 'task', label: 'Task', type: 'textarea', placeholder: 'What needs to be created?', required: true },
      { name: 'criteria', label: 'Revision Criteria', type: 'textarea', placeholder: 'What should be improved?', required: true },
    ],
    examples: reflectionExamples,
  },
];

export function getFrameworkById(id: string): Framework | undefined {
  return frameworks.find((f) => f.id === id);
}

export function generatePrompt(frameworkId: string, data: Record<string, string | string[]>): string {
  return validateAndGenerate(frameworkId, data);
}
