import { describe, it, expect } from '@jest/globals';
import { generatePrompt, getFrameworkById } from '../src/frameworks';

describe('Framework Prompt Generation', () => {
  describe('Tree-of-Thought (ToT)', () => {
    it('should generate valid prompt with all required fields', () => {
      const data = {
        role: 'expert problem solver',
        objective: 'Solve a complex math problem',
        approaches: '3',
        criteria: 'Accuracy and efficiency',
      };

      const prompt = generatePrompt('tot', data);

      expect(prompt).toContain('You are a expert problem solver');
      expect(prompt).toContain('Your objective: Solve a complex math problem');
      expect(prompt).toContain('Please generate 3 different approaches');
      expect(prompt).toContain('Evaluate it based on these criteria: Accuracy and efficiency');
      expect(prompt).toContain('recommend the best one');
    });

    it('should handle special characters in input fields', () => {
      const data = {
        role: 'expert & solver',
        objective: 'Test with "quotes" and <tags>',
        approaches: '2',
        criteria: 'Speed > 100ms',
      };

      const prompt = generatePrompt('tot', data);

      expect(prompt).toContain('expert & solver');
      expect(prompt).toContain('"quotes"');
      expect(prompt).toContain('<tags>');
      expect(prompt).toContain('Speed > 100ms');
    });

    it('should return error message when missing required fields', () => {
      const data = {
        role: 'expert',
        objective: 'Solve problem',
        approaches: '3',
      };

      const prompt = generatePrompt('tot', data);

      expect(prompt).toContain('Missing required fields');
    });

    it('should return error message when fields are empty strings', () => {
      const data = {
        role: '',
        objective: 'Solve problem',
        approaches: '3',
        criteria: 'Accuracy',
      };

      const prompt = generatePrompt('tot', data);

      expect(prompt).toContain('Missing required fields');
    });
  });

  describe('Chain-of-Thought (CoT)', () => {
    it('should generate valid prompt with required fields only', () => {
      const data = {
        role: 'logical thinker',
        problem: 'Calculate compound interest',
      };

      const prompt = generatePrompt('cot', data);

      expect(prompt).toContain('You are a logical thinker');
      expect(prompt).toContain('Problem: Calculate compound interest');
      expect(prompt).toContain('step by step');
      expect(prompt).not.toContain('Context:');
    });

    it('should include optional context when provided', () => {
      const data = {
        role: 'logical thinker',
        problem: 'Calculate compound interest',
        context: 'Principal: $1000, Rate: 5%, Time: 10 years',
      };

      const prompt = generatePrompt('cot', data);

      expect(prompt).toContain('Context: Principal: $1000, Rate: 5%, Time: 10 years');
    });

    it('should return error message when missing required problem field', () => {
      const data = {
        role: 'logical thinker',
      };

      const prompt = generatePrompt('cot', data);

      expect(prompt).toContain('Missing required fields');
    });
  });

  describe('Self-Consistency', () => {
    it('should generate valid prompt with correct version count', () => {
      const data = {
        role: 'analytical reasoner',
        goal: 'Determine the best investment strategy',
        versions: '4',
      };

      const prompt = generatePrompt('self-consistency', data);

      expect(prompt).toContain('You are a analytical reasoner');
      expect(prompt).toContain('Goal: Determine the best investment strategy');
      expect(prompt).toContain('Please provide 4 independent reasoning paths');
      expect(prompt).toContain('most consistent answer');
    });

    it('should return error message when missing versions field', () => {
      const data = {
        role: 'analytical reasoner',
        goal: 'Determine strategy',
      };

      const prompt = generatePrompt('self-consistency', data);

      expect(prompt).toContain('Missing required fields');
    });
  });

  describe('Role Prompting', () => {
    it('should generate valid prompt without optional examples', () => {
      const data = {
        role: 'professional copywriter',
        tone: 'Friendly and engaging',
        task: 'Write a product description',
      };

      const prompt = generatePrompt('role', data);

      expect(prompt).toContain('You are a professional copywriter');
      expect(prompt).toContain('Tone/Style: Friendly and engaging');
      expect(prompt).toContain('Task: Write a product description');
      expect(prompt).not.toContain('Examples:');
    });

    it('should include examples when provided', () => {
      const data = {
        role: 'professional copywriter',
        tone: 'Friendly and engaging',
        task: 'Write a product description',
        examples: 'Example 1: ...',
      };

      const prompt = generatePrompt('role', data);

      expect(prompt).toContain('Examples:\nExample 1: ...');
    });
  });

  describe('Reflection', () => {
    it('should generate valid prompt with three-step structure', () => {
      const data = {
        role: 'critical editor',
        task: 'Write an essay',
        criteria: 'Clarity, grammar, and flow',
      };

      const prompt = generatePrompt('reflection', data);

      expect(prompt).toContain('You are a critical editor');
      expect(prompt).toContain('Task: Write an essay');
      expect(prompt).toContain('Step 1: Create an initial version');
      expect(prompt).toContain('Step 2: Critical reflection');
      expect(prompt).toContain('Step 3: Revised version');
      expect(prompt).toContain('Clarity, grammar, and flow');
    });
  });

  describe('Framework Retrieval', () => {
    it('should retrieve framework by valid ID', () => {
      const framework = getFrameworkById('tot');

      expect(framework).toBeDefined();
      expect(framework?.id).toBe('tot');
      expect(framework?.name).toBe('Tree-of-Thought (ToT)');
      expect(framework?.fields.length).toBeGreaterThan(0);
    });

    it('should return undefined for non-existent framework', () => {
      const framework = getFrameworkById('invalid-framework');

      expect(framework).toBeUndefined();
    });

    it('should return undefined for empty string ID', () => {
      const framework = getFrameworkById('');

      expect(framework).toBeUndefined();
    });

    it('should have all required properties for each framework', () => {
      const frameworkIds = ['tot', 'self-consistency', 'cot', 'role', 'reflection'];

      frameworkIds.forEach((id) => {
        const framework = getFrameworkById(id);
        expect(framework).toBeDefined();
        expect(framework?.id).toBe(id);
        expect(framework?.name).toBeTruthy();
        expect(framework?.description).toBeTruthy();
        expect(Array.isArray(framework?.fields)).toBe(true);
        expect(framework?.fields.length).toBeGreaterThan(0);
        
        framework?.fields.forEach((field) => {
          expect(field.name).toBeTruthy();
          expect(field.label).toBeTruthy();
          expect(['text', 'textarea', 'number']).toContain(field.type);
        });
      });
    });

    it('should have reference examples for all frameworks', () => {
      const frameworkIds = ['tot', 'self-consistency', 'cot', 'role', 'reflection'];

      frameworkIds.forEach((id) => {
        const framework = getFrameworkById(id);
        expect(framework).toBeDefined();
        expect(framework?.example).toBeDefined();
        expect(typeof framework?.example).toBe('object');
        
        // Verify example has values for required fields
        framework?.fields.forEach((field) => {
          if (field.required) {
            expect(framework.example?.[field.name]).toBeTruthy();
          }
        });
      });
    });

    it('should generate valid prompts using example data', () => {
      const frameworkIds = ['tot', 'self-consistency', 'cot', 'role', 'reflection'];

      frameworkIds.forEach((id) => {
        const framework = getFrameworkById(id);
        expect(framework).toBeDefined();
        
        if (framework?.example) {
          const prompt = generatePrompt(id, framework.example);
          expect(prompt).toBeTruthy();
          expect(prompt).not.toContain('Missing required fields');
          expect(prompt).not.toContain('Invalid framework type');
        }
      });
    });
  });

  describe('Invalid Framework Handling', () => {
    it('should return error message for invalid framework ID in generatePrompt', () => {
      const data = {
        role: 'test',
        problem: 'test problem',
      };

      const prompt = generatePrompt('nonexistent-framework', data);

      expect(prompt).toContain('Invalid framework type');
    });

    it('should return error message for empty framework ID', () => {
      const data = {
        role: 'test',
        problem: 'test problem',
      };

      const prompt = generatePrompt('', data);

      expect(prompt).toContain('Invalid framework type');
    });
  });
});
