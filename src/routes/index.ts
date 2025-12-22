import { FastifyPluginAsync } from 'fastify';
import { requireAuth, loadUserFromSession } from '../plugins/auth';
import { USER_CONSTANTS } from '../constants';
import { getAppVersion } from '../utils/version';
import { HOME_FEATURES } from '../utils/home';
import { ViewContextBuilder } from '../utils/view-context';

const indexRoutes: FastifyPluginAsync = async (fastify) => {
  // Home page
  fastify.get('/', async (request, reply) => {
    await loadUserFromSession(request);

    // Determine CTA button based on auth status
    const getStartedBtn = !request.user 
      ? { href: '/auth/register', text: 'Get Started' }
      : { href: '/frameworks', text: 'Explore Frameworks' };

    return reply.viewWithCsrf('home', ViewContextBuilder.with(request, {
      getStartedBtn,
      features: HOME_FEATURES
    }));
  });

  // About page
  fastify.get('/about', async (request, reply) => {
    await loadUserFromSession(request);

    return reply.viewWithCsrf('about', ViewContextBuilder.with(request, {
      version: getAppVersion(),
    }));
  });

  // Premium page
  fastify.get('/premium', { preHandler: requireAuth }, async (request, reply) => {
    return reply.viewWithCsrf('premium', ViewContextBuilder.with(request, {
      freeTierLimit: USER_CONSTANTS.FREE_TIER_PROMPT_LIMIT,
    }));
  });
};

export default indexRoutes;
