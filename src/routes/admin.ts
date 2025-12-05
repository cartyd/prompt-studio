import { FastifyPluginAsync } from 'fastify';
import { requireAdmin } from '../plugins/auth';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Admin Dashboard
  fastify.get('/dashboard', { preHandler: requireAdmin }, async (request, reply) => {
    // Get key metrics
    const [totalUsers, premiumUsers, totalPrompts, totalEvents] = await Promise.all([
      fastify.prisma.user.count(),
      fastify.prisma.user.count({ where: { subscriptionTier: 'premium' } }),
      fastify.prisma.prompt.count(),
      fastify.prisma.event.count(),
    ]);

    // Recent events (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const recentEvents = await fastify.prisma.event.count({
      where: { createdAt: { gte: yesterday } },
    });

    // Device type distribution
    const deviceStats = await fastify.prisma.event.groupBy({
      by: ['deviceType'],
      _count: true,
      where: { deviceType: { not: null } },
    });

    // Top countries
    const countryStats = await fastify.prisma.event.groupBy({
      by: ['country'],
      _count: true,
      where: { country: { not: null } },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    });

    return reply.viewWithCsrf('admin/dashboard', {
      user: request.user,
      subscription: request.subscription,
      stats: {
        totalUsers,
        premiumUsers,
        freeUsers: totalUsers - premiumUsers,
        totalPrompts,
        totalEvents,
        recentEvents,
      },
      deviceStats,
      countryStats,
    });
  });

  // User Management
  fastify.get('/users', { preHandler: requireAdmin }, async (request, reply) => {
    const page = parseInt((request.query as any).page || '1', 10);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const [users, totalUsers] = await Promise.all([
      fastify.prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { prompts: true, events: true },
          },
        },
      }),
      fastify.prisma.user.count(),
    ]);

    const totalPages = Math.ceil(totalUsers / pageSize);

    return reply.viewWithCsrf('admin/users', {
      user: request.user,
      subscription: request.subscription,
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        pageSize,
      },
    });
  });

  // Toggle user premium status
  fastify.post('/users/:userId/toggle-premium', { preHandler: requireAdmin }, async (request, reply) => {
    const { userId } = request.params as { userId: string };

    const targetUser = await fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return reply.status(404).view('errors/404', {
        user: request.user,
        message: 'User not found',
      });
    }

    const isPremium = targetUser.subscriptionTier === 'premium';
    const newTier = isPremium ? 'free' : 'premium';
    const expiresAt = isPremium
      ? null
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    await fastify.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: newTier,
        subscriptionExpiresAt: expiresAt,
      },
    });

    return reply.redirect('/admin/users');
  });

  // Toggle user admin status
  fastify.post('/users/:userId/toggle-admin', { preHandler: requireAdmin }, async (request, reply) => {
    const { userId } = request.params as { userId: string };

    // Prevent self-demotion
    if (userId === request.user!.id) {
      return reply.status(400).view('errors/400', {
        user: request.user,
        message: 'You cannot remove your own admin privileges',
      });
    }

    const targetUser = await fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return reply.status(404).view('errors/404', {
        user: request.user,
        message: 'User not found',
      });
    }

    await fastify.prisma.user.update({
      where: { id: userId },
      data: { isAdmin: !targetUser.isAdmin },
    });

    return reply.redirect('/admin/users');
  });

  // Analytics page
  fastify.get('/analytics', { preHandler: requireAdmin }, async (request, reply) => {
    const days = parseInt((request.query as any).days || '7', 10);
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Event type distribution
    const eventStats = await fastify.prisma.event.groupBy({
      by: ['eventType'],
      _count: true,
      where: { createdAt: { gte: since } },
      orderBy: { _count: { eventType: 'desc' } },
    });

    // Daily event counts
    const dailyEvents = await fastify.prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count
      FROM Event
      WHERE createdAt >= ${since.toISOString()}
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `;

    // Browser distribution
    const browserStats = await fastify.prisma.event.groupBy({
      by: ['browser'],
      _count: true,
      where: {
        createdAt: { gte: since },
        browser: { not: null },
      },
      orderBy: { _count: { browser: 'desc' } },
      take: 10,
    });

    return reply.viewWithCsrf('admin/analytics', {
      user: request.user,
      subscription: request.subscription,
      days,
      eventStats,
      dailyEvents,
      browserStats,
    });
  });
};

export default adminRoutes;
