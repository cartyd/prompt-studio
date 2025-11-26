import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import ejs from 'ejs';
import path from 'path';
import './types';

// Plugins
import prismaPlugin from './plugins/prisma';
import authPlugin from './plugins/auth';

// Routes
import indexRoutes from './routes/index';
import authRoutes from './routes/auth';
import frameworkRoutes from './routes/frameworks';
import promptRoutes from './routes/prompts';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-in-production';

const server = Fastify({
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
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
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
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    });

    // Register Prisma
    await server.register(prismaPlugin);

    // Register auth plugin
    await server.register(authPlugin);

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
      prefix: '/public/',
    });

    // Register routes
    await server.register(indexRoutes, { prefix: '/' });
    await server.register(authRoutes, { prefix: '/auth' });
    await server.register(frameworkRoutes, { prefix: '/frameworks' });
    await server.register(promptRoutes, { prefix: '/prompts' });

    // Start server
    await server.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
