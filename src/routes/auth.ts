import { FastifyPluginAsync, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { ERROR_MESSAGES } from '../constants';
import { validateEmail, validatePassword, validateName } from '../validation';
import { logEvent } from '../utils/analytics';
import { createVerificationToken, validateAndConsumeToken } from '../utils/tokens';
import { sendVerificationEmail, sendPasswordResetEmail, sendPasswordChangedNotification } from '../utils/email';

async function renderAuthError(
  reply: FastifyReply,
  template: 'auth/register' | 'auth/login' | 'auth/forgot-password',
  error: string
) {
  return reply.viewWithCsrf(template, {
    error,
    user: null,
    success: null,
  });
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const isTest = process.env.NODE_ENV === 'test';
  
  // Registration page
  fastify.get('/register', async (request, reply) => {
    return reply.viewWithCsrf('auth/register', { 
      error: null,
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
    let { name, email, password } = request.body as { 
      name: string; 
      email: string; 
      password: string 
    };

    // Normalize email for consistent storage and lookups
    if (email) email = email.trim().toLowerCase();

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

    // Hash password and create user (not verified by default)
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await fastify.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        emailVerified: false,
      },
    });

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
    return reply.viewWithCsrf('auth/login', { 
      error: null,
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
    let { email, password } = request.body as { 
      email: string; 
      password: string 
    };

    // Normalize email for consistent lookups
    if (email) email = email.trim().toLowerCase();

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

    // Log login event
    await logEvent(fastify.prisma, request, user.id, 'login');

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
    let { email } = request.body as { email: string };

    // Normalize email for consistent lookups
    if (email) email = email.trim().toLowerCase();

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

    let user = await fastify.prisma.user.findUnique({
      where: { email },
    });

    // Fallback for SQLite collation issues: case-insensitive match via raw SQL
    if (!user) {
      try {
        const rows = await fastify.prisma.$queryRaw<any[]>`SELECT id, name, email FROM User WHERE lower(email) = lower(${email}) LIMIT 1`;
        if (rows && rows.length > 0) {
          user = rows[0] as any;
          fastify.log.info({ email, matched: (user as any).email }, 'forgot-password fallback match via lower(email)');
        }
      } catch (e) {
        fastify.log.error({ err: e, email }, 'forgot-password fallback lookup failed');
      }
    }

    // Always show the same message to prevent email enumeration
    const successMessage = ERROR_MESSAGES.AUTH.PASSWORD_RESET_SENT;

    if (user) {
      fastify.log.info({ email }, 'forgot-password user found; generating token');
      const token = await createVerificationToken(fastify.prisma, user.id, 'password_reset');
      fastify.log.info({ email }, 'forgot-password token created; sending email');
      try {
        await sendPasswordResetEmail(user.email, token, (user as any).name || '');
        fastify.log.info({ email: user.email }, 'forgot-password email send attempted');
      } catch (err) {
        fastify.log.error({ err, email: user.email }, 'Failed to send password reset email');
      }
    } else {
      fastify.log.info({ email }, 'forgot-password user not found');
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

    return reply.viewWithCsrf('auth/reset-password', {
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

    if (!token || !password || !confirmPassword) {
      return reply.viewWithCsrf('auth/reset-password', {
        token: token || '',
        error: ERROR_MESSAGES.AUTH.ALL_FIELDS_REQUIRED,
        user: null,
      });
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return reply.viewWithCsrf('auth/reset-password', {
        token,
        error: ERROR_MESSAGES.AUTH.PASSWORD_MISMATCH,
        user: null,
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return reply.viewWithCsrf('auth/reset-password', {
        token,
        error: passwordValidation.error!,
        user: null,
      });
    }

    // Validate and consume token
    const userId = await validateAndConsumeToken(fastify.prisma, token, 'password_reset');

    if (!userId) {
      return reply.viewWithCsrf('auth/reset-password', {
        token,
        error: ERROR_MESSAGES.AUTH.TOKEN_EXPIRED,
        user: null,
      });
    }

    // Get user
    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.viewWithCsrf('auth/reset-password', {
        token,
        error: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
        user: null,
      });
    }

    // Update password and mark email as verified
    // Users who can reset their password have proven email ownership
    const passwordHash = await bcrypt.hash(password, 10);
    await fastify.prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Destroy any existing sessions for this user (security measure)
    // Note: This would require session management by userId, which we don't have
    // The user will need to login again anyway

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
