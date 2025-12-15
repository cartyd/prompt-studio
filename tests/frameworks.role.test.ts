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

describe('Framework Prompt Generation – Role Prompting', () => {
  test.each([
    {
      name: 'valid without examples',
      data: {
        role: 'professional copywriter',
        tone: 'Friendly and engaging',
        task: 'Write a product description',
      },
      expects: [
        'You are a professional copywriter',
        'Tone/Style: Friendly and engaging',
        'Task: Write a product description',
      ],
      notExpects: ['Examples:'],
    },
    {
      name: 'valid with examples',
      data: {
        role: 'professional copywriter',
        tone: 'Friendly and engaging',
        task: 'Write a product description',
        examples: 'Example 1: ...',
      },
      expects: ['Examples:\nExample 1: ...'],
      notExpects: [],
    },
  ])('should generate prompt: $name', ({ data, expects, notExpects }) => {
    const prompt = generatePrompt('role', sanitize(data));
    for (const s of expects) expect(prompt).toContain(s);
    for (const s of notExpects) expect(prompt).not.toContain(s);
  });
});