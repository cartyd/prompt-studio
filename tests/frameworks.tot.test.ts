import { describe, expect, test } from '@jest/globals';
import { generatePrompt } from '../src/frameworks';

// Helper to remove undefined and enforce string|string[] without type assertions
function sanitize(obj: Record<string, unknown>): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      out[k] = v;
    } else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
      out[k] = v as string[]; // safe by runtime check
    }
  }
  return out;
}

describe('Framework Prompt Generation – Tree-of-Thought (ToT)', () => {
  test.each([
    {
      name: 'valid with all required fields',
      data: {
        role: 'expert problem solver',
        objective: 'Solve a complex math problem',
        approaches: '3',
        criteria: 'Accuracy and efficiency',
      },
      expects: [
        'You are a expert problem solver',
        'Your objective: Solve a complex math problem',
        'Please generate 3 different approaches',
        'Evaluate it based on these criteria: Accuracy and efficiency',
        'recommend the best one',
      ],
    },
    {
      name: 'valid with special characters',
      data: {
        role: 'expert & solver',
        objective: 'Test with "quotes" and <tags>',
        approaches: '2',
        criteria: 'Speed > 100ms',
      },
      expects: ['expert & solver', '"quotes"', '<tags>', 'Speed > 100ms'],
    },
  ])('should generate prompt: $name', ({ data, expects }) => {
    const prompt = generatePrompt('tot', sanitize(data));
    for (const s of expects) expect(prompt).toContain(s);
  });

  test.each([
    {
      name: 'missing required criteria',
      data: { role: 'expert', objective: 'Solve problem', approaches: '3' },
      error: 'Missing required fields',
    },
    {
      name: 'empty role field',
      data: { role: '', objective: 'Solve problem', approaches: '3', criteria: 'Accuracy' },
      error: 'Missing required fields',
    },
  ])('should throw error: $name', ({ data, error }) => {
    expect(() => generatePrompt('tot', sanitize(data))).toThrow(error);
  });
});