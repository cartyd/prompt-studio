import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import fastifyFormbody from '@fastify/formbody';
import fastifyCsrf from '@fastify/csrf-protection';
import ejs from 'ejs';
import path from 'path';
import Database from 'better-sqlite3';
import SqliteStore from 'fastify-session-better-sqlite3-store';
import './types';
import { TIME_CONSTANTS } from './constants';

// Plugins
import prismaPlugin from './plugins/prisma';
import authPlugin, { loadUserFromSession } from './plugins/auth';
import csrfPlugin from './plugins/csrf';

// Routes
import indexRoutes from './routes/index';
import authRoutes from './routes/auth';
import frameworkRoutes from './routes/frameworks';
import promptRoutes from './routes/prompts';
import customCriteriaRoutes from './routes/custom-criteria';
import adminRoutes from './routes/admin';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && (!secret || secret === 'change-this-secret-in-production')) {
    throw new Error(
      'SESSION_SECRET environment variable must be set in production. ' +
      'Generate a secure secret using: openssl rand -base64 32'
    );
  }

  return secret || 'change-this-secret-in-production';
}

const SESSION_SECRET = getSessionSecret();

// Initialize SQLite database for session storage
const sessionDb = new Database(path.join(__dirname, '../sessions.db'));

const server = Fastify({
  trustProxy: true, // Needed for DigitalOcean deployment with nginx
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

async function start() {
  try {
    // Register security plugins
    await server.register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.boxicons.com"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
          fontSrc: ["'self'", "https://unpkg.com", "https://cdn.boxicons.com", "data:"],
          imgSrc: ["'self'", "data:"],
        },
      },
    });

    await server.register(fastifyRateLimit, {
      global: false,
      max: 100,
      timeWindow: '15 minutes',
    });

    // Register cookie and session
    await server.register(fastifyCookie);
    await server.register(fastifySession, {
      secret: SESSION_SECRET,
      store: new SqliteStore(sessionDb),
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: TIME_CONSTANTS.SESSION_MAX_AGE_MS,
      },
    });

    // Register form body parser BEFORE CSRF (CSRF needs to read _csrf from form body)
    await server.register(fastifyFormbody);

    // Register CSRF protection
    await server.register(fastifyCsrf, {
      sessionPlugin: '@fastify/session',
    });

    // Register Prisma
    await server.register(prismaPlugin);

    // Register auth plugin
    await server.register(authPlugin);

    // Register CSRF plugin
    await server.register(csrfPlugin);

    // Register view engine
    await server.register(fastifyView, {
      engine: { ejs },
      root: path.join(__dirname, 'views'),
      options: {
        filename: path.join(__dirname, 'views'),
      },
    });

    // Register static files
    await server.register(fastifyStatic, {
      root: path.join(__dirname, '../public'),
      prefix: '/',
    });

    // Register routes
    await server.register(indexRoutes, { prefix: '/' });
    await server.register(authRoutes, { prefix: '/auth' });
    await server.register(frameworkRoutes, { prefix: '/frameworks' });
    await server.register(promptRoutes, { prefix: '/prompts' });
    await server.register(customCriteriaRoutes, { prefix: '/api/custom-criteria' });
    await server.register(adminRoutes, { prefix: '/admin' });

    // 404 handler - must be registered after all routes
    server.setNotFoundHandler(async (request, reply) => {
      await loadUserFromSession(request);
      return reply.status(404).viewWithCsrf('errors/404', {
        user: request.user,
        subscription: request.subscription,
        message: `The page "${request.url}" could not be found.`,
      });
    });

    // Custom error handler
    server.setErrorHandler(async (error, request, reply) => {
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Type guard to check if error has expected properties
      const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error 
        ? (error.statusCode as number) 
        : 500;
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
        ? (error.message as string) 
        : 'Unknown error';
      
      // Log the full error with context
      server.log.error({
        error,
        url: request.url,
        method: request.method,
        statusCode,
        userId: request.session?.userId,
      }, 'Error occurred');
      
      // Load user session for error pages
      await loadUserFromSession(request);
      
      // Render appropriate error page based on status code
      const errorPages: Record<number, string> = {
        400: 'errors/400',
        403: 'errors/403',
        500: 'errors/500',
      };
      
      const errorTemplate = errorPages[statusCode];
      
      if (errorTemplate) {
        // Render branded error page for known error codes
        const displayMessage = isProduction && statusCode === 500 
          ? 'An error occurred processing your request' 
          : errorMessage;
        
        return reply.status(statusCode).viewWithCsrf(errorTemplate, {
          user: request.user,
          subscription: request.subscription,
          message: displayMessage,
        });
      }
      
      // For other errors, render 500 page as fallback
      return reply.status(statusCode).viewWithCsrf('errors/500', {
        user: request.user,
        subscription: request.subscription,
        message: isProduction 
          ? 'An unexpected error occurred' 
          : errorMessage,
      });
    });

    // Start server
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
