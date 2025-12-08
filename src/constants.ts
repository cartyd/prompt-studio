export const TIME_CONSTANTS = {
  SESSION_MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  PREMIUM_SUBSCRIPTION_DAYS: 90,
} as const;

export const TOKEN_CONSTANTS = {
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  TOKEN_BYTE_LENGTH: 32, // 64 hex characters
} as const;

export const ERROR_MESSAGES = {
  AUTH: {
    ALL_FIELDS_REQUIRED: 'All fields are required',
    PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
    EMAIL_ALREADY_REGISTERED: 'Email already registered',
    EMAIL_PASSWORD_REQUIRED: 'Email and password are required',
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in. Check your inbox for the verification link.',
    INVALID_TOKEN: 'Invalid or expired verification token. Please request a new one.',
    TOKEN_EXPIRED: 'This verification link has expired. Please request a new one.',
    PASSWORD_RESET_SENT: 'If an account exists with that email, password reset instructions have been sent.',
    PASSWORD_MISMATCH: 'Passwords do not match',
    VERIFICATION_EMAIL_SENT: 'A verification email has been sent to your email address.',
  },
  PROMPTS: {
    NOT_FOUND: 'Prompt not found',
    EXPORT_PREMIUM_ONLY: 'Exporting prompts is a premium feature. Upgrade to access this feature.',
  },
  FRAMEWORKS: {
    NOT_FOUND: 'Framework not found',
  },
} as const;
