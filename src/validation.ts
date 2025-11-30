export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const VALIDATION_CONSTANTS = {
  // RFC 5322 compliant email regex (practical subset)
  // Matches: valid email addresses with proper structure including TLD
  // Rejects: missing @, invalid characters, malformed domains, missing TLD
  EMAIL_REGEX: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_UPPERCASE_REGEX: /[A-Z]/,
  PASSWORD_LOWERCASE_REGEX: /[a-z]/,
  PASSWORD_NUMBER_REGEX: /\d/,
  NAME_MIN_LENGTH: 2,
} as const;

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  if (!VALIDATION_CONSTANTS.EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  return { isValid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH) {
    return { isValid: false, error: `Password must be at least ${VALIDATION_CONSTANTS.PASSWORD_MIN_LENGTH} characters` };
  }

  if (!VALIDATION_CONSTANTS.PASSWORD_UPPERCASE_REGEX.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!VALIDATION_CONSTANTS.PASSWORD_LOWERCASE_REGEX.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!VALIDATION_CONSTANTS.PASSWORD_NUMBER_REGEX.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  return { isValid: true };
}

export function validateName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < VALIDATION_CONSTANTS.NAME_MIN_LENGTH) {
    return { isValid: false, error: `Name must be at least ${VALIDATION_CONSTANTS.NAME_MIN_LENGTH} characters` };
  }

  return { isValid: true };
}
