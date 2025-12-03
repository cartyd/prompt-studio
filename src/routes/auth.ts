import { FastifyPluginAsync, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { ERROR_MESSAGES } from '../constants';
import { validateEmail, validatePassword, validateName } from '../validation';
import { logEvent } from '../utils/analytics';

function renderAuthError(reply: FastifyReply, template: 'auth/register' | 'auth/login', error: string) {
  return reply.view(template, { 
    error,
    user: null 
  });
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const isTest = process.env.NODE_ENV === 'test';
  
  // Registration page
  fastify.get('/register', async (request, reply) => {
    return reply.view('auth/register', { 
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
    const { name, email, password } = request.body as { 
      name: string; 
      email: string; 
      password: string 
    };

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
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await fastify.prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    // Set session
    request.session.userId = user.id;

    return reply.redirect('/frameworks');
  });

  // Login page
  fastify.get('/login', async (request, reply) => {
    return reply.view('auth/login', { 
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
    const { email, password } = request.body as { 
      email: string; 
      password: string 
    };

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

    request.session.userId = user.id;

    // Log login event
    await logEvent(fastify.prisma, user.id, 'login');

    return reply.redirect('/frameworks');
  });

  // Logout handler
  fastify.post('/logout', async (request, reply) => {
    await request.session.destroy();
    return reply.redirect('/');
  });
};

export default authRoutes;
