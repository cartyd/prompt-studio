import { FastifyPluginAsync } from 'fastify';
import { requireAdmin, requireAuth } from '../plugins/auth';
import { AdminQueryParams } from '../types';
import { USER_CONSTANTS, PAGINATION_CONSTANTS } from '../constants';
import { ViewContextBuilder } from '../utils/view-context';
import { AdminAnalyticsService } from '../services/admin-analytics';
import { SubscriptionService } from '../services/subscription';
import { getCountryName } from '../utils/country-mapping';

const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Admin Dashboard
  fastify.get('/dashboard', { preHandler: requireAdmin }, async (request, reply) => {
    // Get key metrics
    const [totalUsers, premiumUsers, totalPrompts, totalEvents] = await Promise.all([
      fastify.prisma.user.count(),
      fastify.prisma.user.count({ where: { subscriptionTier: USER_CONSTANTS.SUBSCRIPTION_TIERS.PREMIUM } }),
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
    const countryStatsRaw = await fastify.prisma.event.groupBy({
      by: ['country'],
      _count: true,
      where: { country: { not: null } },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    });

    // Map country codes to names using utility
    const countryStats = countryStatsRaw.map((stat: { country: string | null; _count: number }) => ({
      country: getCountryName(stat.country),
      countryCode: stat.country,
      _count: stat._count,
    }));

    return reply.viewWithCsrf('admin/dashboard', ViewContextBuilder.with(request, {
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
    }));
  });

  // User Management
  fastify.get('/users', { preHandler: requireAdmin }, async (request, reply) => {
    const query = request.query as AdminQueryParams;
    const page = parseInt(query.page || '1', 10);
    const pageSize = PAGINATION_CONSTANTS.ADMIN_USERS_PAGE_SIZE;
    const skip = (page - 1) * pageSize;

    const [users, totalUsers] = await Promise.all([
      fastify.prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          isAdmin: true,
          subscriptionTier: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: { prompts: true, events: true },
          },
        },
      }),
      fastify.prisma.user.count(),
    ]);

    const totalPages = Math.ceil(totalUsers / pageSize);

    return reply.viewWithCsrf('admin/users', ViewContextBuilder.with(request, {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        pageSize,
      },
    }));
  });

  // Toggle user premium status
  fastify.post('/users/:userId/toggle-premium', { preHandler: requireAdmin }, async (request, reply) => {
    const { userId } = request.params as { userId: string };

    try {
      await SubscriptionService.togglePremium(fastify.prisma, userId);
      return reply.redirect('/admin/users');
    } catch (error) {
      return reply.status(404).view('errors/404', ViewContextBuilder.withError(request, 'User not found'));
    }
  });

  // Toggle user admin status
  fastify.post('/users/:userId/toggle-admin', { preHandler: requireAdmin }, async (request, reply) => {
    const { userId } = request.params as { userId: string };

    // Prevent self-demotion
    if (userId === request.user!.id) {
      return reply.status(400).view('errors/400', ViewContextBuilder.withError(request, 'You cannot remove your own admin privileges'));
    }

    const targetUser = await fastify.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return reply.status(404).view('errors/404', ViewContextBuilder.withError(request, 'User not found'));
    }

    await fastify.prisma.user.update({
      where: { id: userId },
      data: { isAdmin: !targetUser.isAdmin },
    });

    return reply.redirect('/admin/users');
  });

  // Self-service: Make current user premium (for testing/development)
  fastify.post('/make-premium', { 
    preHandler: [requireAuth, fastify.csrfProtection] 
  }, async (request, reply) => {
    await SubscriptionService.grantPremium(fastify.prisma, request.user!.id);
    return reply.redirect('/premium');
  });

  // Analytics page
  fastify.get('/analytics', { preHandler: requireAdmin }, async (request, reply) => {
    const query = request.query as AdminQueryParams;
    const days = parseInt(query.days || '7', 10);

    // Use analytics service to get all analytics data
    const analyticsService = new AdminAnalyticsService(fastify.prisma);
    const analytics = await analyticsService.getAnalytics(days);

    return reply.viewWithCsrf('admin/analytics', ViewContextBuilder.with(request, {
      days,
      ...analytics,
    }));
  });
};

export default adminRoutes;
