import { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../plugins/auth';

const indexRoutes: FastifyPluginAsync = async (fastify) => {
  // Home page
  fastify.get('/', async (request, reply) => {
    // Check if user is logged in
    if (request.session.userId) {
      const user = await fastify.prisma.user.findUnique({
        where: { id: request.session.userId },
      });
      if (user) {
        request.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
        };
      }
    }

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
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90 days from now

    await fastify.prisma.user.update({
      where: { id: request.user!.id },
      data: {
        subscriptionTier: 'premium',
        subscriptionExpiresAt: expiresAt,
      },
    });

    return reply.redirect('/premium');
  });
};

export default indexRoutes;
