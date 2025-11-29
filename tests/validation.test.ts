import { describe, it, expect } from '@jest/globals';
import { validateEmail, validatePassword, validateName } from '../src/validation';

describe('Email Validation', () => {
  it('should accept valid email addresses', () => {
    const validEmails = [
      'user@example.com',
      'test.user@example.com',
      'user+tag@example.co.uk',
      'user_name@sub.example.com',
      '123@example.com',
    ];

    validEmails.forEach((email) => {
      const result = validateEmail(email);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  it('should reject empty email', () => {
    const result = validateEmail('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Email is required');
  });

  it('should reject email without @ symbol', () => {
    const result = validateEmail('userexample.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('should reject email without domain', () => {
    const result = validateEmail('user@');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('should reject email without TLD', () => {
    const result = validateEmail('user@example');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('should reject email with spaces', () => {
    const result = validateEmail('user name@example.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });

  it('should reject email with multiple @ symbols', () => {
    const result = validateEmail('user@@example.com');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid email format');
  });
});

describe('Password Validation', () => {
  it('should accept valid strong passwords', () => {
    const validPasswords = [
      'Password123',
      'Str0ngP@ss',
      'MyP@ssw0rd',
      'Abcdefgh1',
    ];

    validPasswords.forEach((password) => {
      const result = validatePassword(password);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  it('should reject empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password is required');
  });

  it('should reject password shorter than 8 characters', () => {
    const result = validatePassword('Pass1');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters');
  });

  it('should reject password with exactly 7 characters', () => {
    const result = validatePassword('Pass123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must be at least 8 characters');
  });

  it('should reject password without uppercase letter', () => {
    const result = validatePassword('password123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least one uppercase letter');
  });

  it('should reject password without lowercase letter', () => {
    const result = validatePassword('PASSWORD123');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least one lowercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePassword('PasswordOnly');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Password must contain at least one number');
  });

  it('should accept password with special characters', () => {
    const result = validatePassword('P@ssw0rd!');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept very long passwords', () => {
    const result = validatePassword('Password123' + 'a'.repeat(100));
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should validate all requirements together', () => {
    // Missing uppercase
    expect(validatePassword('password123').isValid).toBe(false);
    // Missing lowercase
    expect(validatePassword('PASSWORD123').isValid).toBe(false);
    // Missing number
    expect(validatePassword('PasswordOnly').isValid).toBe(false);
    // Too short
    expect(validatePassword('Pass1').isValid).toBe(false);
    // All requirements met
    expect(validatePassword('Password123').isValid).toBe(true);
  });
});

describe('Name Validation', () => {
  it('should accept valid names', () => {
    const validNames = [
      'John',
      'Mary Smith',
      'Jean-Paul',
      "O'Brien",
      'José García',
      'AB',
    ];

    validNames.forEach((name) => {
      const result = validateName(name);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  it('should reject empty name', () => {
    const result = validateName('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name is required');
  });

  it('should reject name with only whitespace', () => {
    const result = validateName('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name is required');
  });

  it('should reject single character name', () => {
    const result = validateName('A');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name must be at least 2 characters');
  });

  it('should reject name with only spaces and single character', () => {
    const result = validateName('  A  ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name must be at least 2 characters');
  });

  it('should accept name with leading/trailing spaces if content is valid', () => {
    const result = validateName('  John  ');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept exactly 2 characters', () => {
    const result = validateName('AB');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
