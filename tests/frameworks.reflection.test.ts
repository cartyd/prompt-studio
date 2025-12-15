import { describe, expect, test } from '@jest/globals';
import { generatePrompt } from '../src/frameworks';

describe('Framework Prompt Generation – Reflection', () => {
  test.each([
    {
      name: 'valid three-step structure',
      data: {
        role: 'critical editor',
        task: 'Write an essay',
        criteria: 'Clarity, grammar, and flow',
      },
      expects: [
        'You are a critical editor',
        'Task: Write an essay',
        'Step 1: Create an initial version',
        'Step 2: Critical reflection',
        'Step 3: Revised version',
        'Clarity, grammar, and flow',
      ],
    },
  ])('should generate prompt: $name', ({ data, expects }) => {
    const prompt = generatePrompt('reflection', data);
    for (const s of expects) expect(prompt).toContain(s);
  });
});