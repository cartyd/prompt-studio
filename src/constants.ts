export const TIME_CONSTANTS = {
  SESSION_MAX_AGE_MS: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  PREMIUM_SUBSCRIPTION_DAYS: 90,
  PREMIUM_SUBSCRIPTION_YEARS: 1, // Default premium subscription duration
} as const;

export const USER_CONSTANTS = {
  FREE_TIER_PROMPT_LIMIT: 5,
  SUBSCRIPTION_TIERS: {
    FREE: 'free',
    PREMIUM: 'premium'
  },
  ROLES: {
    USER: 'user',
    ADMIN: 'admin'
  }
} as const;

export const TOKEN_CONSTANTS = {
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  EMAIL_CHANGE_EXPIRY_HOURS: 24,
  TOKEN_BYTE_LENGTH: 32, // 64 hex characters
} as const;

export const SECURITY_CONSTANTS = {
  BCRYPT_SALT_ROUNDS: 10, // Number of salt rounds for bcrypt hashing
} as const;

export const PAGINATION_CONSTANTS = {
  ADMIN_USERS_PAGE_SIZE: 20, // Number of users per page in admin panel
} as const;

export const FILE_CONSTANTS = {
  MAX_FILENAME_LENGTH: 255, // Maximum length for filenames (filesystem limit)
  FILENAME_EXTENSION_LENGTH: 4, // Reserve space for file extensions like ".txt"
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
  ACCOUNT: {
    CURRENT_PASSWORD_REQUIRED: 'Current password is required',
    CURRENT_PASSWORD_INCORRECT: 'Current password is incorrect',
    NEW_PASSWORD_REQUIRED: 'New password is required',
    NEW_PASSWORD_SAME: 'New password must be different from current password',
    PASSWORD_CHANGED: 'Password changed successfully',
    EMAIL_REQUIRED: 'Email address is required',
    EMAIL_SAME: 'New email must be different from current email',
    EMAIL_ALREADY_IN_USE: 'This email address is already in use',
    EMAIL_CHANGE_REQUESTED: 'Email change request sent. Please check both email addresses.',
    EMAIL_CHANGE_VERIFIED: 'Email address verified. Your email has been updated.',
    EMAIL_CHANGE_REVOKED: 'Email change request has been cancelled.',
    EMAIL_CHANGE_EXPIRED: 'This email change request has expired. Please start a new request.',
    EMAIL_CHANGE_INVALID: 'Invalid email change request.',
    PENDING_EMAIL_CHANGE: 'You have a pending email change request. Please complete or cancel it first.',
  },
  PROMPTS: {
    NOT_FOUND: 'Prompt not found',
    EXPORT_PREMIUM_ONLY: 'Exporting prompts is a premium feature. Upgrade to access this feature.',
  },
  FRAMEWORKS: {
    NOT_FOUND: 'Framework not found',
  },
} as const;
