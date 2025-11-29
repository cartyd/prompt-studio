export const TIME_CONSTANTS = {
  SESSION_MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  PREMIUM_SUBSCRIPTION_DAYS: 90,
} as const;

export const ERROR_MESSAGES = {
  AUTH: {
    ALL_FIELDS_REQUIRED: 'All fields are required',
    PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
    EMAIL_ALREADY_REGISTERED: 'Email already registered',
    EMAIL_PASSWORD_REQUIRED: 'Email and password are required',
    INVALID_CREDENTIALS: 'Invalid email or password',
  },
  PROMPTS: {
    NOT_FOUND: 'Prompt not found',
    EXPORT_PREMIUM_ONLY: 'Exporting prompts is a premium feature. Upgrade to access this feature.',
  },
  FRAMEWORKS: {
    NOT_FOUND: 'Framework not found',
  },
} as const;
