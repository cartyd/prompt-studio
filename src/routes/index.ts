import { FastifyPluginAsync } from 'fastify';
import { requireAuth, loadUserFromSession } from '../plugins/auth';
import { TIME_CONSTANTS, USER_CONSTANTS } from '../constants';
import { getAppVersion } from '../utils/version';

const indexRoutes: FastifyPluginAsync = async (fastify) => {
  // Home page
  fastify.get('/', async (request, reply) => {
    await loadUserFromSession(request);

    // Determine CTA button based on auth status
    const getStartedBtn = !request.user 
      ? { href: '/auth/register', text: 'Get Started' }
      : { href: '/frameworks', text: 'Explore Frameworks' };

    return reply.viewWithCsrf('home', {
      user: request.user,
      subscription: request.subscription,
      getStartedBtn
    });
  });

  // About page
  fastify.get('/about', async (request, reply) => {
    await loadUserFromSession(request);

    return reply.viewWithCsrf('about', {
      user: request.user,
      subscription: request.subscription,
      version: getAppVersion(),
    });
  });

  // Premium page
  fastify.get('/premium', { preHandler: requireAuth }, async (request, reply) => {
    return reply.viewWithCsrf('premium', {
      user: request.user,
      subscription: request.subscription,
    });
  });

  // Admin endpoint to make user premium (for testing)
  fastify.post('/admin/make-premium', { 
    preHandler: [requireAuth, fastify.csrfProtection] 
  }, async (request, reply) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TIME_CONSTANTS.PREMIUM_SUBSCRIPTION_DAYS);

    await fastify.prisma.user.update({
      where: { id: request.user!.id },
      data: {
        subscriptionTier: USER_CONSTANTS.SUBSCRIPTION_TIERS.PREMIUM,
        subscriptionExpiresAt: expiresAt,
      },
    });

    return reply.redirect('/premium');
  });
};

export default indexRoutes;
