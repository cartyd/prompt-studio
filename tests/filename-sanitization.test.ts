import { describe, it, expect } from '@jest/globals';

// Copy of the sanitizeFilename function for testing
const MAX_FILENAME_LENGTH = 255;
const DEFAULT_FILENAME = 'prompt';

function sanitizeFilename(title: string): string {
  // Replace non-alphanumeric characters with underscores
  let sanitized = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  // Remove leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  
  // Replace multiple consecutive underscores with a single one
  sanitized = sanitized.replace(/_+/g, '_');
  
  // If empty after sanitization, use default
  if (sanitized.length === 0) {
    sanitized = DEFAULT_FILENAME;
  }
  
  // Truncate if too long (reserve space for extension)
  const maxBaseLength = MAX_FILENAME_LENGTH - 4; // -4 for ".txt"
  if (sanitized.length > maxBaseLength) {
    sanitized = sanitized.substring(0, maxBaseLength);
    // Remove trailing underscore if truncation created one
    sanitized = sanitized.replace(/_+$/, '');
  }
  
  return sanitized;
}

describe('Filename Sanitization', () => {
  describe('Basic sanitization', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeFilename('MyPrompt')).toBe('myprompt');
    });

    it('should replace spaces with underscores', () => {
      expect(sanitizeFilename('My Prompt')).toBe('my_prompt');
    });

    it('should replace special characters with underscores', () => {
      expect(sanitizeFilename('My@Prompt#123')).toBe('my_prompt_123');
    });

    it('should handle alphanumeric characters', () => {
      expect(sanitizeFilename('Prompt123')).toBe('prompt123');
    });
  });

  describe('Edge case handling', () => {
    it('should handle empty string', () => {
      expect(sanitizeFilename('')).toBe(DEFAULT_FILENAME);
    });

    it('should handle only special characters', () => {
      expect(sanitizeFilename('!@#$%^&*()')).toBe(DEFAULT_FILENAME);
    });

    it('should remove leading underscores', () => {
      expect(sanitizeFilename('___prompt')).toBe('prompt');
    });

    it('should remove trailing underscores', () => {
      expect(sanitizeFilename('prompt___')).toBe('prompt');
    });

    it('should remove leading and trailing underscores', () => {
      expect(sanitizeFilename('___prompt___')).toBe('prompt');
    });

    it('should collapse multiple consecutive underscores', () => {
      expect(sanitizeFilename('my___prompt___title')).toBe('my_prompt_title');
    });

    it('should handle mixed edge cases', () => {
      expect(sanitizeFilename('___My   Prompt!!!___')).toBe('my_prompt');
    });
  });

  describe('Length handling', () => {
    it('should not truncate normal length filenames', () => {
      const normal = 'a'.repeat(50);
      expect(sanitizeFilename(normal)).toBe(normal);
    });

    it('should truncate excessively long filenames', () => {
      const veryLong = 'a'.repeat(300);
      const result = sanitizeFilename(veryLong);
      expect(result.length).toBeLessThanOrEqual(MAX_FILENAME_LENGTH - 4);
    });

    it('should handle exactly max length', () => {
      const maxLength = 'a'.repeat(MAX_FILENAME_LENGTH - 4);
      const result = sanitizeFilename(maxLength);
      expect(result.length).toBe(MAX_FILENAME_LENGTH - 4);
    });

    it('should remove trailing underscore after truncation', () => {
      // Create a string that when truncated would end with underscore
      const longWithSpecial = 'a'.repeat(MAX_FILENAME_LENGTH - 5) + '!!!!';
      const result = sanitizeFilename(longWithSpecial);
      expect(result.endsWith('_')).toBe(false);
    });
  });

  describe('Real-world examples', () => {
    it('should handle typical prompt titles', () => {
      expect(sanitizeFilename('Tree-of-Thought Prompt')).toBe('tree_of_thought_prompt');
    });

    it('should handle titles with dates', () => {
      expect(sanitizeFilename('Prompt 2024-01-15')).toBe('prompt_2024_01_15');
    });

    it('should handle titles with parentheses', () => {
      expect(sanitizeFilename('My Prompt (v2)')).toBe('my_prompt_v2');
    });

    it('should handle titles with quotes', () => {
      expect(sanitizeFilename('My "Special" Prompt')).toBe('my_special_prompt');
    });

    it('should handle emoji and unicode', () => {
      expect(sanitizeFilename('Prompt 🚀 Amazing')).toBe('prompt_amazing');
    });

    it('should handle file extension attempts', () => {
      expect(sanitizeFilename('prompt.exe.txt')).toBe('prompt_exe_txt');
    });
  });

  describe('Security considerations', () => {
    it('should handle path traversal attempts', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etc_passwd');
    });

    it('should handle Windows path separators', () => {
      expect(sanitizeFilename('C:\\Windows\\System32')).toBe('c_windows_system32');
    });

    it('should handle null bytes (URL encoded)', () => {
      expect(sanitizeFilename('prompt%00.txt')).toBe('prompt_00_txt');
    });

    it('should handle directory names', () => {
      expect(sanitizeFilename('./prompt')).toBe('prompt');
      expect(sanitizeFilename('../prompt')).toBe('prompt');
    });
  });
});
