import { FastifyPluginAsync } from 'fastify';
import { requireAuth, loadUserFromSession } from '../plugins/auth';
import { TIME_CONSTANTS } from '../constants';

const indexRoutes: FastifyPluginAsync = async (fastify) => {
  // Home page
  fastify.get('/', async (request, reply) => {
    await loadUserFromSession(request);

    return reply.view('home', {
      user: request.user,
    });
  });

  // Premium page
  fastify.get('/premium', { preHandler: requireAuth }, async (request, reply) => {
    return reply.view('premium', {
      user: request.user,
      subscription: request.subscription,
    });
  });

  // Admin endpoint to make user premium (for testing)
  fastify.post('/admin/make-premium', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).redirect('/auth/login');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TIME_CONSTANTS.PREMIUM_SUBSCRIPTION_DAYS);

    await fastify.prisma.user.update({
      where: { id: request.user.id },
      data: {
        subscriptionTier: 'premium',
        subscriptionExpiresAt: expiresAt,
      },
    });

    return reply.redirect('/premium');
  });
};

export default indexRoutes;
