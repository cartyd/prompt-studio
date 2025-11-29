import { describe, it, expect } from '@jest/globals';
import { 
  validateAndGenerate,
  getPromptGenerator,
} from '../src/prompt-generators';

describe('Prompt Generator Functions', () => {
  describe('getPromptGenerator', () => {
    it('should return generator function for valid framework IDs', () => {
      const validIds = ['tot', 'self-consistency', 'cot', 'role', 'reflection'];

      validIds.forEach((id) => {
        const generator = getPromptGenerator(id);
        expect(generator).toBeDefined();
        expect(typeof generator).toBe('function');
      });
    });

    it('should return undefined for invalid framework ID', () => {
      const generator = getPromptGenerator('invalid-framework');
      expect(generator).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const generator = getPromptGenerator('');
      expect(generator).toBeUndefined();
    });
  });

  describe('validateAndGenerate', () => {
    describe('Error Handling', () => {
      it('should throw error for invalid framework ID', () => {
        expect(() => {
          validateAndGenerate('invalid-framework', {});
        }).toThrow('Invalid framework type: invalid-framework');
      });

      it('should throw error for empty framework ID', () => {
        expect(() => {
          validateAndGenerate('', {});
        }).toThrow('Invalid framework type: ');
      });

      it('should throw error when missing required fields for ToT', () => {
        expect(() => {
          validateAndGenerate('tot', {
            role: 'expert',
            objective: 'solve problem',
            approaches: '3',
            // missing criteria
          });
        }).toThrow('Missing required fields for Tree-of-Thought framework');
      });

      it('should throw error when missing required fields for Self-Consistency', () => {
        expect(() => {
          validateAndGenerate('self-consistency', {
            role: 'expert',
            goal: 'solve problem',
            // missing versions
          });
        }).toThrow('Missing required fields for Self-Consistency framework');
      });

      it('should throw error when missing required fields for CoT', () => {
        expect(() => {
          validateAndGenerate('cot', {
            role: 'expert',
            // missing problem
          });
        }).toThrow('Missing required fields for Chain-of-Thought framework');
      });

      it('should throw error when missing required fields for Role Prompting', () => {
        expect(() => {
          validateAndGenerate('role', {
            role: 'expert',
            tone: 'professional',
            // missing task
          });
        }).toThrow('Missing required fields for Role Prompting framework');
      });

      it('should throw error when missing required fields for Reflection', () => {
        expect(() => {
          validateAndGenerate('reflection', {
            role: 'expert',
            task: 'write essay',
            // missing criteria
          });
        }).toThrow('Missing required fields for Reflection framework');
      });
    });

    describe('Successful Generation', () => {
      it('should generate valid ToT prompt with all fields', () => {
        const prompt = validateAndGenerate('tot', {
          role: 'expert analyst',
          objective: 'analyze market trends',
          approaches: '5',
          criteria: 'accuracy and reliability',
        });

        expect(typeof prompt).toBe('string');
        expect(prompt).toContain('expert analyst');
        expect(prompt).toContain('analyze market trends');
        expect(prompt).toContain('5 different approaches');
        expect(prompt).toContain('accuracy and reliability');
      });

      it('should generate valid Self-Consistency prompt', () => {
        const prompt = validateAndGenerate('self-consistency', {
          role: 'critical thinker',
          goal: 'determine best strategy',
          versions: '3',
        });

        expect(typeof prompt).toBe('string');
        expect(prompt).toContain('critical thinker');
        expect(prompt).toContain('determine best strategy');
        expect(prompt).toContain('3 independent reasoning paths');
      });

      it('should generate valid CoT prompt with optional context', () => {
        const prompt = validateAndGenerate('cot', {
          role: 'mathematician',
          problem: 'solve equation',
          context: 'quadratic formula',
        });

        expect(typeof prompt).toBe('string');
        expect(prompt).toContain('mathematician');
        expect(prompt).toContain('solve equation');
        expect(prompt).toContain('quadratic formula');
      });

      it('should generate valid CoT prompt without optional context', () => {
        const prompt = validateAndGenerate('cot', {
          role: 'mathematician',
          problem: 'solve equation',
        });

        expect(typeof prompt).toBe('string');
        expect(prompt).toContain('mathematician');
        expect(prompt).toContain('solve equation');
        expect(prompt).not.toContain('Context:');
      });

      it('should generate valid Role Prompting prompt with examples', () => {
        const prompt = validateAndGenerate('role', {
          role: 'copywriter',
          tone: 'enthusiastic',
          task: 'write ad copy',
          examples: 'Example 1: Amazing product!',
        });

        expect(typeof prompt).toBe('string');
        expect(prompt).toContain('copywriter');
        expect(prompt).toContain('enthusiastic');
        expect(prompt).toContain('write ad copy');
        expect(prompt).toContain('Example 1: Amazing product!');
      });

      it('should generate valid Role Prompting prompt without examples', () => {
        const prompt = validateAndGenerate('role', {
          role: 'copywriter',
          tone: 'enthusiastic',
          task: 'write ad copy',
        });

        expect(typeof prompt).toBe('string');
        expect(prompt).toContain('copywriter');
        expect(prompt).toContain('enthusiastic');
        expect(prompt).toContain('write ad copy');
        expect(prompt).not.toContain('Examples:');
      });

      it('should generate valid Reflection prompt', () => {
        const prompt = validateAndGenerate('reflection', {
          role: 'editor',
          task: 'write article',
          criteria: 'clarity and conciseness',
        });

        expect(typeof prompt).toBe('string');
        expect(prompt).toContain('editor');
        expect(prompt).toContain('write article');
        expect(prompt).toContain('clarity and conciseness');
        expect(prompt).toContain('Step 1');
        expect(prompt).toContain('Step 2');
        expect(prompt).toContain('Step 3');
      });
    });

    describe('Field Validation', () => {
      it('should reject empty string fields', () => {
        expect(() => {
          validateAndGenerate('tot', {
            role: '',
            objective: 'solve problem',
            approaches: '3',
            criteria: 'accuracy',
          });
        }).toThrow('Missing required fields');
      });

      it('should accept fields with special characters', () => {
        const prompt = validateAndGenerate('tot', {
          role: 'expert & consultant',
          objective: 'analyze <data> with "quotes"',
          approaches: '2',
          criteria: 'speed > 100ms',
        });

        expect(prompt).toContain('expert & consultant');
        expect(prompt).toContain('<data>');
        expect(prompt).toContain('"quotes"');
        expect(prompt).toContain('speed > 100ms');
      });

      it('should accept very long field values', () => {
        const longText = 'a'.repeat(1000);
        const prompt = validateAndGenerate('cot', {
          role: 'expert',
          problem: longText,
        });

        expect(prompt).toContain(longText);
      });
    });
  });
});
