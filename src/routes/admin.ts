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
    const dailyEvents = await fastify.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        date(createdAt/1000, 'unixepoch') as date,
        COUNT(*) as count
      FROM Event
      WHERE createdAt >= ${since.getTime()}
      GROUP BY date(createdAt/1000, 'unixepoch')
      ORDER BY date DESC
    `;
    
    // Convert bigint count to number for display
    const dailyEventsFormatted = dailyEvents.map(e => ({
      date: e.date,
      count: Number(e.count)
    }));
    
    // Time of day distribution (6-hour increments)
    // Morning: 6-11, Afternoon: 12-17, Evening: 18-23, Night: 0-5
    const timeOfDayQuery = await fastify.prisma.$queryRaw<Array<{ period: string; count: bigint }>>`
      SELECT 
        CASE 
          WHEN CAST(strftime('%H', createdAt/1000, 'unixepoch', 'localtime') AS INTEGER) BETWEEN 6 AND 11 THEN 'Morning (6am-12pm)'
          WHEN CAST(strftime('%H', createdAt/1000, 'unixepoch', 'localtime') AS INTEGER) BETWEEN 12 AND 17 THEN 'Afternoon (12pm-6pm)'
          WHEN CAST(strftime('%H', createdAt/1000, 'unixepoch', 'localtime') AS INTEGER) BETWEEN 18 AND 23 THEN 'Evening (6pm-12am)'
          ELSE 'Night (12am-6am)'
        END as period,
        COUNT(*) as count
      FROM Event
      WHERE createdAt >= ${since.getTime()}
      GROUP BY period
      ORDER BY 
        CASE period
          WHEN 'Morning (6am-12pm)' THEN 1
          WHEN 'Afternoon (12pm-6pm)' THEN 2
          WHEN 'Evening (6pm-12am)' THEN 3
          WHEN 'Night (12am-6am)' THEN 4
        END
    `;
    
    const timeOfDayStats = timeOfDayQuery.map(t => ({
      period: t.period,
      count: Number(t.count)
    }));
    
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

    // Framework usage statistics (extract from metadata)
    const frameworkEvents = await fastify.prisma.event.findMany({
      where: {
        createdAt: { gte: since },
        eventType: { in: ['framework_view', 'prompt_generate'] },
        metadata: { not: null },
      },
      select: {
        eventType: true,
        metadata: true,
      },
    });

    // Parse metadata and aggregate framework stats
    const frameworkStatsMap = new Map<string, { views: number; generates: number }>();
    
    for (const event of frameworkEvents) {
      if (event.metadata) {
        try {
          const metadata = JSON.parse(event.metadata);
          const frameworkName = metadata.frameworkName || metadata.frameworkType;
          
          if (frameworkName) {
            const stats = frameworkStatsMap.get(frameworkName) || { views: 0, generates: 0 };
            
            if (event.eventType === 'framework_view') {
              stats.views++;
            } else if (event.eventType === 'prompt_generate') {
              stats.generates++;
            }
            
            frameworkStatsMap.set(frameworkName, stats);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    // Convert to array and sort by total usage
    const frameworkStats = Array.from(frameworkStatsMap.entries())
      .map(([name, stats]) => ({
        name,
        views: stats.views,
        generates: stats.generates,
        total: stats.views + stats.generates,
      }))
      .sort((a, b) => b.total - a.total);

    return reply.viewWithCsrf('admin/analytics', {
      user: request.user,
      subscription: request.subscription,
      days,
      eventStats,
      dailyEvents: dailyEventsFormatted,
      timeOfDayStats,
      browserStats,
      frameworkStats,
    });
  });
};

export default adminRoutes;
