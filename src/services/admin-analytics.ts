import { PrismaClient } from '@prisma/client';

/**
 * Analytics data structures
 */
export interface DailyEventData {
  date: string;
  count: number;
}

export interface TimeOfDayData {
  period: string;
  count: number;
}

export interface FrameworkUsageData {
  name: string;
  views: number;
  generates: number;
  total: number;
}

export interface AnalyticsSummary {
  eventStats: Array<{ eventType: string; _count: number }>;
  dailyEvents: DailyEventData[];
  timeOfDayStats: TimeOfDayData[];
  browserStats: Array<{ browser: string | null; _count: number }>;
  frameworkStats: FrameworkUsageData[];
}

/**
 * Service for admin analytics data aggregation
 * Separates complex business logic from route handlers
 */
export class AdminAnalyticsService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get comprehensive analytics for the specified time period
   */
  async getAnalytics(days: number): Promise<AnalyticsSummary> {
    const since = this.calculateSinceDate(days);

    const [
      eventStats,
      dailyEvents,
      timeOfDayStats,
      browserStats,
      frameworkStats
    ] = await Promise.all([
      this.getEventTypeDistribution(since),
      this.getDailyEventCounts(since),
      this.getTimeOfDayDistribution(since),
      this.getBrowserDistribution(since),
      this.getFrameworkUsageStats(since)
    ]);

    return {
      eventStats,
      dailyEvents,
      timeOfDayStats,
      browserStats,
      frameworkStats
    };
  }

  /**
   * Calculate the "since" date for the given number of days
   */
  private calculateSinceDate(days: number): Date {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return since;
  }

  /**
   * Get event type distribution for the time period
   */
  private async getEventTypeDistribution(since: Date) {
    return await this.prisma.event.groupBy({
      by: ['eventType'],
      _count: true,
      where: { createdAt: { gte: since } },
      orderBy: { _count: { eventType: 'desc' } },
    });
  }

  /**
   * Get daily event counts using raw SQL for date aggregation
   */
  private async getDailyEventCounts(since: Date): Promise<DailyEventData[]> {
    const rawResults = await this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        date(createdAt/1000, 'unixepoch') as date,
        COUNT(*) as count
      FROM Event
      WHERE createdAt >= ${since.getTime()}
      GROUP BY date(createdAt/1000, 'unixepoch')
      ORDER BY date DESC
    `;

    return rawResults.map(e => ({
      date: e.date,
      count: Number(e.count)
    }));
  }

  /**
   * Get time of day distribution (Morning, Afternoon, Evening, Night)
   */
  private async getTimeOfDayDistribution(since: Date): Promise<TimeOfDayData[]> {
    const rawResults = await this.prisma.$queryRaw<Array<{ period: string; count: bigint }>>`
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

    return rawResults.map(t => ({
      period: t.period,
      count: Number(t.count)
    }));
  }

  /**
   * Get browser distribution (top 10)
   */
  private async getBrowserDistribution(since: Date) {
    return await this.prisma.event.groupBy({
      by: ['browser'],
      _count: true,
      where: {
        createdAt: { gte: since },
        browser: { not: null },
      },
      orderBy: { _count: { browser: 'desc' } },
      take: 10,
    });
  }

  /**
   * Get framework usage statistics from event metadata
   */
  private async getFrameworkUsageStats(since: Date): Promise<FrameworkUsageData[]> {
    const frameworkEvents = await this.prisma.event.findMany({
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

    const frameworkStatsMap = this.aggregateFrameworkStats(frameworkEvents);
    
    return this.sortFrameworkStats(frameworkStatsMap);
  }

  /**
   * Parse and aggregate framework statistics from event metadata
   */
  private aggregateFrameworkStats(
    events: Array<{ eventType: string; metadata: string | null }>
  ): Map<string, { views: number; generates: number }> {
    const frameworkStatsMap = new Map<string, { views: number; generates: number }>();

    for (const event of events) {
      if (!event.metadata) continue;

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
        // Skip invalid JSON metadata
      }
    }

    return frameworkStatsMap;
  }

  /**
   * Convert framework stats map to sorted array
   */
  private sortFrameworkStats(
    statsMap: Map<string, { views: number; generates: number }>
  ): FrameworkUsageData[] {
    return Array.from(statsMap.entries())
      .map(([name, stats]) => ({
        name,
        views: stats.views,
        generates: stats.generates,
        total: stats.views + stats.generates,
      }))
      .sort((a, b) => b.total - a.total);
  }
}
