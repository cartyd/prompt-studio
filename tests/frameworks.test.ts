import { describe, it, expect } from '@jest/globals';
import { generatePrompt, getFrameworkById } from '../src/frameworks';

describe('Framework Prompt Generation', () => {
  it('should generate Tree-of-Thought prompt', () => {
    const data = {
      role: 'expert problem solver',
      objective: 'Solve a complex math problem',
      approaches: '3',
      criteria: 'Accuracy and efficiency',
    };

    const prompt = generatePrompt('tot', data);

    expect(prompt).toContain('expert problem solver');
    expect(prompt).toContain('Solve a complex math problem');
    expect(prompt).toContain('3 different approaches');
    expect(prompt).toContain('Accuracy and efficiency');
  });

  it('should generate Chain-of-Thought prompt', () => {
    const data = {
      role: 'logical thinker',
      problem: 'Calculate compound interest',
      context: 'Principal: $1000, Rate: 5%, Time: 10 years',
    };

    const prompt = generatePrompt('cot', data);

    expect(prompt).toContain('logical thinker');
    expect(prompt).toContain('Calculate compound interest');
    expect(prompt).toContain('Principal: $1000');
    expect(prompt).toContain('step by step');
  });

  it('should generate Self-Consistency prompt', () => {
    const data = {
      role: 'analytical reasoner',
      goal: 'Determine the best investment strategy',
      versions: '4',
    };

    const prompt = generatePrompt('self-consistency', data);

    expect(prompt).toContain('analytical reasoner');
    expect(prompt).toContain('Determine the best investment strategy');
    expect(prompt).toContain('4 independent reasoning paths');
  });

  it('should retrieve framework by ID', () => {
    const framework = getFrameworkById('tot');

    expect(framework).toBeDefined();
    expect(framework?.name).toBe('Tree-of-Thought (ToT)');
    expect(framework?.fields.length).toBeGreaterThan(0);
  });

  it('should return undefined for invalid framework ID', () => {
    const framework = getFrameworkById('invalid-framework');

    expect(framework).toBeUndefined();
  });

  it('should have required fields for all frameworks', () => {
    const frameworkIds = ['tot', 'self-consistency', 'cot', 'role', 'reflection'];

    frameworkIds.forEach((id) => {
      const framework = getFrameworkById(id);
      expect(framework).toBeDefined();
      expect(framework?.id).toBe(id);
      expect(framework?.name).toBeTruthy();
      expect(framework?.description).toBeTruthy();
      expect(framework?.fields).toBeTruthy();
    });
  });
});
