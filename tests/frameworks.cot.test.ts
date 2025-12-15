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

describe('Framework Prompt Generation – Chain-of-Thought (CoT)', () => {
  test.each([
    {
      name: 'valid with required fields only',
      data: { role: 'logical thinker', problem: 'Calculate compound interest' },
      expects: [
        'You are a logical thinker',
        'Problem: Calculate compound interest',
        'step by step',
      ],
      notExpects: ['Context:'],
    },
    {
      name: 'valid with optional context',
      data: {
        role: 'logical thinker',
        problem: 'Calculate compound interest',
        context: 'Principal: $1000, Rate: 5%, Time: 10 years',
      },
      expects: ['Context: Principal: $1000, Rate: 5%, Time: 10 years'],
      notExpects: [],
    },
  ])('should generate prompt: $name', ({ data, expects, notExpects }) => {
    const prompt = generatePrompt('cot', sanitize(data));
    for (const s of expects) expect(prompt).toContain(s);
    for (const s of notExpects) expect(prompt).not.toContain(s);
  });

  test.each([
    {
      name: 'missing required problem field',
      data: { role: 'logical thinker' },
      error: 'Missing required fields',
    },
  ])('should throw error: $name', ({ data, error }) => {
    expect(() => generatePrompt('cot', sanitize(data))).toThrow(error);
  });
});