import { describe, expect, test } from '@jest/globals';
import { generatePrompt } from '../src/frameworks';

describe('Framework Prompt Generation – Self-Consistency', () => {
  test.each([
    {
      name: 'valid with versions count',
      data: {
        role: 'analytical reasoner',
        goal: 'Determine the best investment strategy',
        versions: '4',
      },
      expects: [
        'You are a analytical reasoner',
        'Goal: Determine the best investment strategy',
        'Please provide 4 independent reasoning paths',
        'most consistent answer',
      ],
    },
  ])('should generate prompt: $name', ({ data, expects }) => {
    const prompt = generatePrompt('self-consistency', data);
    for (const s of expects) expect(prompt).toContain(s);
  });

  test.each([
    {
      name: 'missing versions field',
      data: { role: 'analytical reasoner', goal: 'Determine strategy' },
      error: 'Missing required fields',
    },
  ])('should throw error: $name', ({ data, error }) => {
    expect(() => generatePrompt('self-consistency', data)).toThrow(error);
  });
});