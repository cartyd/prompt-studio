import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcrypt';
import { ERROR_MESSAGES } from '../constants';
import { validateEmail, validatePassword, validateName } from '../validation';

const authRoutes: FastifyPluginAsync = async (fastify) => {
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
      rateLimit: {
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
      return reply.view('auth/register', { 
        error: ERROR_MESSAGES.AUTH.ALL_FIELDS_REQUIRED,
        user: null 
      });
    }

    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      return reply.view('auth/register', { 
        error: nameValidation.error,
        user: null 
      });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return reply.view('auth/register', { 
        error: emailValidation.error,
        user: null 
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return reply.view('auth/register', { 
        error: passwordValidation.error,
        user: null 
      });
    }

    // Check if user exists
    const existingUser = await fastify.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return reply.view('auth/register', { 
        error: ERROR_MESSAGES.AUTH.EMAIL_ALREADY_REGISTERED,
        user: null 
      });
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
      rateLimit: {
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
      return reply.view('auth/login', { 
        error: ERROR_MESSAGES.AUTH.EMAIL_PASSWORD_REQUIRED,
        user: null 
      });
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return reply.view('auth/login', { 
        error: emailValidation.error,
        user: null 
      });
    }

    const user = await fastify.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.view('auth/login', { 
        error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
        user: null 
      });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return reply.view('auth/login', { 
        error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
        user: null 
      });
    }

    request.session.userId = user.id;

    return reply.redirect('/frameworks');
  });

  // Logout handler
  fastify.post('/logout', async (request, reply) => {
    request.session.set('userId', undefined);
    return reply.redirect('/');
  });
};

export default authRoutes;
