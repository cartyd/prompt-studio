import { describe, it, expect, beforeAll } from '@jest/globals';
import { getStartedButtonLogic, HOME_FEATURES } from '../src/utils/home';

// Mock localStorage before any imports
beforeAll(() => {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  };
});

describe('Home Route Business Logic', () => {
  describe('getStartedButtonLogic', () => {
    it('should return register link for unauthenticated users', () => {
      const result = getStartedButtonLogic(null);
      
      expect(result).toEqual({
        href: '/auth/register',
        text: 'Get Started'
      });
    });

    it('should return frameworks link for authenticated users', () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      const result = getStartedButtonLogic(user);

      expect(result).toEqual({
        href: '/frameworks',
        text: 'Explore Frameworks'
      });
    });

    it('should return frameworks link for any truthy user object', () => {
      const user = { id: '42' }; // minimal user object
      const result = getStartedButtonLogic(user);

      expect(result).toEqual({
        href: '/frameworks',
        text: 'Explore Frameworks'
      });
    });

    it('should return register link for undefined user', () => {
      const result = getStartedButtonLogic(undefined);

      expect(result).toEqual({
        href: '/auth/register',
        text: 'Get Started'
      });
    });
  });

  describe('Button Structure Validation', () => {
    it('should always return an object with href and text properties', () => {
      const testCases = [null, undefined, { id: '1' }, { id: '1', email: 'test@test.com' }];
      
      testCases.forEach(user => {
        const result = getStartedButtonLogic(user);

        expect(result).toHaveProperty('href');
        expect(result).toHaveProperty('text');
        expect(typeof result.href).toBe('string');
        expect(typeof result.text).toBe('string');
        expect(result.href.length).toBeGreaterThan(0);
        expect(result.text.length).toBeGreaterThan(0);
      });
    });

    it('should only return valid route paths', () => {
      const result1 = getStartedButtonLogic(null);
      const result2 = getStartedButtonLogic({ id: '1' });

      expect(result1.href).toMatch(/^\/[a-z\/]+$/);
      expect(result2.href).toMatch(/^\/[a-z\/]+$/);
    });
  });

  describe('HOME_FEATURES constant', () => {
    it('should contain 6 feature cards', () => {
      expect(HOME_FEATURES).toHaveLength(6);
    });

    it('should have consistent structure for all features', () => {
      HOME_FEATURES.forEach((feature) => {
        expect(feature).toHaveProperty('icon');
        expect(feature).toHaveProperty('title');
        expect(feature).toHaveProperty('description');
        expect(typeof feature.icon).toBe('string');
        expect(typeof feature.title).toBe('string');
        expect(typeof feature.description).toBe('string');
        expect(feature.icon.length).toBeGreaterThan(0);
        expect(feature.title.length).toBeGreaterThan(0);
        expect(feature.description.length).toBeGreaterThan(0);
      });
    });

    it('should have valid boxicon classes', () => {
      HOME_FEATURES.forEach(feature => {
        expect(feature.icon).toMatch(/^bx-[a-z-]+$/);
      });
    });
  });

  // Additional comprehensive validation tests (consolidated from standalone file)
  describe('Edge Cases and Input Validation', () => {
    it('should handle various user object shapes consistently', () => {
      const testUsers = [
        { id: '1' },
        { id: '1', email: 'test@test.com' },
        { id: '42', name: 'Test' },
        { id: '123', email: 'test@test.com', name: 'Test' },
      ];

      testUsers.forEach(user => {
        const result = getStartedButtonLogic(user);
        expect(result.href).toBe('/frameworks');
        expect(result.text).toBe('Explore Frameworks');
      });
    });

    it('should handle all falsy values as unauthenticated', () => {
      const falsyValues = [null, undefined];

      falsyValues.forEach(value => {
        const result = getStartedButtonLogic(value);
        expect(result.href).toBe('/auth/register');
        expect(result.text).toBe('Get Started');
      });
    });
  });
});