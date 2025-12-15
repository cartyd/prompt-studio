import { describe, it, expect } from '@jest/globals';
import { generatePrompt } from '../src/frameworks';

describe('Invalid Framework Handling', () => {
  it('should throw error for invalid framework ID in generatePrompt', () => {
    const data = {
      role: 'test',
      problem: 'test problem',
    };

    expect(() => generatePrompt('nonexistent-framework', data)).toThrow('Invalid framework type');
  });

  it('should throw error for empty framework ID', () => {
    const data = {
      role: 'test',
      problem: 'test problem',
    };

    expect(() => generatePrompt('', data)).toThrow('Invalid framework type');
  });
});