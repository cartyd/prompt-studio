import { FastifyPluginAsync, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { ERROR_MESSAGES, SECURITY_CONSTANTS } from '../constants';
import { EmailNormalizationService } from '../services/email-normalization';
import { validateEmail, validatePassword, validateName } from '../validation';
import { logEvent } from '../utils/analytics';
import { createVerificationToken, validateAndConsumeToken } from '../utils/tokens';
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedNotification } from '../utils/email';
import { UserQueryResult } from '../types';
import { AuthUtils } from '../utils/auth-helpers';

// Form configurations to eliminate duplication
const REGISTER_FORM_CONFIG = {
  title: 'Create Account',
  action: '/auth/register',
  fields: [
    { name: 'name', label: 'Name', type: 'text', autocomplete: 'name' },
    { name: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
    { name: 'password', label: 'Password', type: 'password', autocomplete: 'new-password', minlength: 8, hint: 'Minimum 8 characters' }
  ],
  submitText: 'Register',
  footerLink: `Already have an account? <a href="/auth/login">Login here</a>`
};

const LOGIN_FORM_CONFIG = {
  title: 'Login',
  action: '/auth/login',
  fields: [
    { name: 'email', label: 'Email', type: 'email', autocomplete: 'email' },
    { 
      name: 'password', 
      label: 'Password', 
      type: 'password', 
      autocomplete: 'current-password',
      additionalContent: `
        <div class="text-right mt-0-5">
          <a href="/auth/forgot-password" class="auth-link">Forgot password?</a>
        </div>
      `
    }
  ],
  submitText: 'Login',
  footerLink: `Don't have an account? <a href="/auth/register">Register here</a>`
};

const RESET_PASSWORD_FORM_CONFIG = (token: string) => ({
  title: 'Reset Your Password',
  action: '/auth/reset-password',
  description: 'Enter your new password below.',
  hiddenFields: [{ name: 'token', value: token }],
  fields: [
    { 
      name: 'password', 
      label: 'New Password', 
      type: 'password',
      minlength: 8,
      hint: 'Minimum 8 characters',
      autofocus: true
    },
    { 
      name: 'confirmPassword', 
      label: 'Confirm New Password', 
      type: 'password',
      minlength: 8
    }
  ],
  submitText: 'Reset Password',
  footerLink: `<a href="/auth/login">Back to Login</a>`
});

/**
 * Helper to render reset password form with error
 */
function renderResetPasswordError(
  reply: FastifyReply,
  token: string,
  error: string
) {
  const formHtml = AuthUtils.renderForm({ 
    ...RESET_PASSWORD_FORM_CONFIG(token), 
    error 
  });
  return reply.viewWithCsrf('auth/reset-password', {
    formHtml,
    token,
    error,
    user: null,
  });
}

function renderAuthError(
  reply: FastifyReply,
  template: 'auth/register' | 'auth/login' | 'auth/forgot-password',
  error: string
) {
  let formHtml: string;
  
  if (template === 'auth/register') {
    formHtml = AuthUtils.renderForm({ ...REGISTER_FORM_CONFIG, error });
  } else if (template === 'auth/login') {
    formHtml = AuthUtils.renderForm({ ...LOGIN_FORM_CONFIG, error });
  } else {
    formHtml = ''; // forgot-password will be handled separately
  }
  
  return reply.viewWithCsrf(template, {
    formHtml,
    error,
    user: null,
    success: null,
  });
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const isTest = process.env.NODE_ENV === 'test';
  fastify.log.info({ NODE_ENV: process.env.NODE_ENV, isTest }, 'Auth routes initialized');
  
  // Registration page
  fastify.get('/register', async (request, reply) => {
    const formHtml = AuthUtils.renderForm({ ...REGISTER_FORM_CONFIG, error: null });
    
    return reply.viewWithCsrf('auth/register', { 
      formHtml,
      user: request.user 
    });
  });

  // Registration handler
  fastify.post('/register', {
    config: {
      rateLimit: isTest ? false : {
        max: 5,
        timeWindow: '5 minutes',
      },
    },
  }, async (request, reply) => {
    const { name, password } = request.body as { 
      name: string; 
      email: string; 
      password: string 
    };
    
    // Normalize email for consistent storage and lookups
    const email = EmailNormalizationService.normalize((request.body as any).email);

    // Validation
    if (!name || !email || !password) {
      return renderAuthError(reply, 'auth/register', ERROR_MESSAGES.AUTH.ALL_FIELDS_REQUIRED);
    }

    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      return renderAuthError(reply, 'auth/register', nameValidation.error!);
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return renderAuthError(reply, 'auth/register', emailValidation.error!);
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return renderAuthError(reply, 'auth/register', passwordValidation.error!);
    }

    // Check if user exists
    const existingUser = await fastify.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return renderAuthError(reply, 'auth/register', ERROR_MESSAGES.AUTH.EMAIL_ALREADY_REGISTERED);
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, SECURITY_CONSTANTS.BCRYPT_SALT_ROUNDS);
    const user = await fastify.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: isTest, // Auto-verify in test environment
        emailVerifiedAt: isTest ? new Date() : null,
      },
    });

    // In test environment, log in immediately and skip email verification
    if (isTest) {
      request.session.userId = user.id;
      return reply.redirect('/frameworks');
    }

    // Generate verification token
    const token = await createVerificationToken(fastify.prisma, user.id, 'email_verification');

    // Send verification email
    try {
      await sendVerificationEmail(email, token, name);
    } catch (err) {
      fastify.log.error({ err }, 'Failed to send verification email');
      // Continue anyway - user can resend later
    }

    // Do NOT set session - user must verify email first
    // Redirect to verification sent page
    return reply.viewWithCsrf('auth/verification-sent', {
      email,
      user: null,
    });
  });

  // Login page
  fastify.get('/login', async (request, reply) => {
    const formHtml = AuthUtils.renderForm({ ...LOGIN_FORM_CONFIG, error: null });
    
    return reply.viewWithCsrf('auth/login', { 
      formHtml,
      user: request.user 
    });
  });

  // Login handler
  fastify.post('/login', {
    config: {
      rateLimit: isTest ? false : {
        max: 5,
        timeWindow: '5 minutes',
      },
    },
  }, async (request, reply) => {
    const { password } = request.body as { 
      email: string; 
      password: string 
    };

    // Normalize email for consistent lookups
    const email = EmailNormalizationService.normalize((request.body as any).email);

    if (!email || !password) {
      return renderAuthError(reply, 'auth/login', ERROR_MESSAGES.AUTH.EMAIL_PASSWORD_REQUIRED);
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return renderAuthError(reply, 'auth/login', emailValidation.error!);
    }

    const user = await fastify.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return renderAuthError(reply, 'auth/login', ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return renderAuthError(reply, 'auth/login', ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    // Check if email is verified
    if (!user.emailVerified) {
      // Redirect to verification required page with resend option
      return reply.viewWithCsrf('auth/verification-required', {
        email: user.email,
        user: null,
      });
    }

    request.session.userId = user.id;

    // Update last login timestamp and log login event
    await Promise.all([
      fastify.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      logEvent(fastify.prisma, request, user.id, 'login'),
    ]);

    // Redirect admin users to dashboard, regular users to frameworks
    if (user.isAdmin) {
      return reply.redirect('/admin/dashboard');
    }
    return reply.redirect('/frameworks');
  });

  // Logout handler with CSRF protection
  fastify.post('/logout', {
    preHandler: fastify.csrfProtection,
  }, async (request, reply) => {
    await request.session.destroy();
    return reply.redirect('/');
  });

  // ===== EMAIL VERIFICATION ROUTES =====

  // Verify email with token
  fastify.get('/verify-email', async (request, reply) => {
    const { token } = request.query as { token?: string };

    if (!token) {
      return reply.viewWithCsrf('auth/verification-error', {
        error: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
        user: null,
      });
    }

    const userId = await validateAndConsumeToken(fastify.prisma, token, 'email_verification');

    if (!userId) {
      return reply.viewWithCsrf('auth/verification-error', {
        error: ERROR_MESSAGES.AUTH.TOKEN_EXPIRED,
        user: null,
      });
    }

    // Mark user as verified
    await fastify.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    return reply.viewWithCsrf('auth/verification-success', {
      user: null,
    });
  });

  // Resend verification email
  fastify.post('/resend-verification', {
    config: {
      rateLimit: isTest ? false : {
        max: 3,
        timeWindow: '15 minutes',
      },
    },
  }, async (request, reply) => {
    let { email } = request.body as { email: string };

    // Normalize email for consistent lookups
    if (email) email = email.trim().toLowerCase();

    if (!email) {
      return reply.viewWithCsrf('auth/verification-sent', {
        email: '',
        user: null,
        error: 'Email is required',
      });
    }

    const user = await fastify.prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or is already verified
    if (user && !user.emailVerified) {
      const token = await createVerificationToken(fastify.prisma, user.id, 'email_verification');
      
      try {
        await sendVerificationEmail(email, token, user.name);
      } catch (err) {
        fastify.log.error({ err }, 'Failed to resend verification email');
      }
    }

    return reply.viewWithCsrf('auth/verification-sent', {
      email,
      user: null,
      fromResend: true,
    });
  });

  // ===== PASSWORD RESET ROUTES =====
  
  /**
   * Find user by email with fallback for case-insensitive matching
   */
  async function findUserByEmail(email: string) {
    let user = await fastify.prisma.user.findUnique({
      where: { email },
    });

    // Fallback for SQLite collation issues: case-insensitive match via raw SQL
    if (!user) {
      try {
        const rows = await fastify.prisma.$queryRaw<UserQueryResult[]>`SELECT id, name, email FROM User WHERE lower(email) = lower(${email}) LIMIT 1`;
        if (rows && rows.length > 0) {
          const partialUser = rows[0];
          // Get full user record by ID to ensure we have all fields
          user = await fastify.prisma.user.findUnique({
            where: { id: partialUser.id }
          });
          if (user) {
            fastify.log.info({ email, matched: partialUser.email }, 'fallback match via lower(email)');
          }
        }
      } catch (e) {
        fastify.log.error({ err: e, email }, 'fallback lookup failed');
      }
    }
    
    return user;
  }
  
  /**
   * Send password reset email to user
   */
  async function sendPasswordResetToUser(user: any) {
    fastify.log.info({ email: user.email }, 'user found; generating token');
    const token = await createVerificationToken(fastify.prisma, user.id, 'password_reset');
    fastify.log.info({ email: user.email }, 'token created; sending email');
    try {
      await sendPasswordResetEmail(user.email, token, user.name || '');
      fastify.log.info({ email: user.email }, 'email send attempted');
    } catch (err) {
      fastify.log.error({ err, email: user.email }, 'Failed to send password reset email');
    }
  }

  // Forgot password page
  fastify.get('/forgot-password', async (_request, reply) => {
    return reply.viewWithCsrf('auth/forgot-password', {
      error: null,
      success: null,
      user: null,
    });
  });

  // Forgot password handler
  fastify.post('/forgot-password', {
    config: {
      rateLimit: isTest ? false : {
        max: 3,
        timeWindow: '15 minutes',
      },
    },
  }, async (request, reply) => {
    // Normalize email for consistent lookups
    const email = EmailNormalizationService.normalize((request.body as any).email);

    // Debug logging to help diagnose delivery issues
    fastify.log.info({ email, cwd: process.cwd(), db: process.env.DATABASE_URL }, 'forgot-password requested');

    if (!email) {
      return reply.viewWithCsrf('auth/forgot-password', {
        error: 'Email is required',
        success: null,
        user: null,
      });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return reply.viewWithCsrf('auth/forgot-password', {
        error: emailValidation.error!,
        success: null,
        user: null,
      });
    }

    // Find user with fallback for case-insensitive matching
    const user = await findUserByEmail(email);

    // Always show the same message to prevent email enumeration
    const successMessage = ERROR_MESSAGES.AUTH.PASSWORD_RESET_SENT;

    if (user) {
      await sendPasswordResetToUser(user);
    } else {
      fastify.log.info({ email }, 'user not found');
    }

    return reply.viewWithCsrf('auth/forgot-password', {
      error: null,
      success: successMessage,
      user: null,
    });
  });

  // Reset password page
  fastify.get('/reset-password', async (request, reply) => {
    const { token } = request.query as { token?: string };

    if (!token) {
      return reply.redirect('/auth/forgot-password');
    }
    
    const formHtml = AuthUtils.renderForm({ ...RESET_PASSWORD_FORM_CONFIG(token), error: null });

    return reply.viewWithCsrf('auth/reset-password', {
      formHtml,
      token,
      error: null,
      user: null,
    });
  });

  // Reset password handler
  fastify.post('/reset-password', {
    config: {
      rateLimit: isTest ? false : {
        max: 5,
        timeWindow: '15 minutes',
      },
    },
  }, async (request, reply) => {
    const { token, password, confirmPassword } = request.body as {
      token: string;
      password: string;
      confirmPassword: string;
    };

    // Validate all fields present
    if (!token || !password || !confirmPassword) {
      return renderResetPasswordError(reply, token || '', ERROR_MESSAGES.AUTH.ALL_FIELDS_REQUIRED);
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return renderResetPasswordError(reply, token, ERROR_MESSAGES.AUTH.PASSWORD_MISMATCH);
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return renderResetPasswordError(reply, token, passwordValidation.error!);
    }

    // Validate and consume token
    const userId = await validateAndConsumeToken(fastify.prisma, token, 'password_reset');
    if (!userId) {
      return renderResetPasswordError(reply, token, ERROR_MESSAGES.AUTH.TOKEN_EXPIRED);
    }

    // Get user
    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return renderResetPasswordError(reply, token, ERROR_MESSAGES.AUTH.INVALID_TOKEN);
    }

    // Update password and mark email as verified
    const passwordHash = await bcrypt.hash(password, SECURITY_CONSTANTS.BCRYPT_SALT_ROUNDS);
    await fastify.prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Send confirmation email
    try {
      await sendPasswordChangedNotification(user.email, user.name);
    } catch (err) {
      fastify.log.error({ err }, 'Failed to send password changed notification');
    }

    return reply.viewWithCsrf('auth/reset-success', {
      user: null,
    });
  });
};

export default authRoutes;
