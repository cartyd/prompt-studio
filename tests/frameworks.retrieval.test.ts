import { describe, it, expect } from '@jest/globals';
import { getFrameworkById } from '../src/frameworks';

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
        expect(['text', 'textarea', 'number', 'multi-select-criteria']).toContain(field.type);
      });
    });
  });

  it('should have reference examples for all frameworks', () => {
    const frameworkIds = ['tot', 'self-consistency', 'cot', 'role', 'reflection'];

    frameworkIds.forEach((id) => {
      const framework = getFrameworkById(id);
      expect(framework).toBeDefined();
      expect(framework?.examples).toBeDefined();
      expect(typeof framework?.examples).toBe('object');
      expect(framework?.examples?.general).toBeDefined();
      expect(framework?.examples?.business).toBeDefined();

      ['general', 'business'].forEach((category) => {
        framework?.fields.forEach((field) => {
          if (field.required) {
            expect(framework.examples?.[category as 'general' | 'business']?.[field.name]).toBeTruthy();
          }
        });
      });
    });
  });
});