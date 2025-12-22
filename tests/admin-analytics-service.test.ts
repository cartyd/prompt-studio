import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AdminAnalyticsService } from '../src/services/admin-analytics';

describe('AdminAnalyticsService', () => {
  let service: AdminAnalyticsService;
  let mockPrisma: any;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrisma = {
      event: {
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };
    
    service = new AdminAnalyticsService(mockPrisma);
  });

  describe('getAnalytics', () => {
    it('should return complete analytics summary', async () => {
      // Mock all the data sources
      mockPrisma.event.groupBy.mockResolvedValueOnce([
        { eventType: 'login', _count: 5 }
      ]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { date: '2025-12-22', count: BigInt(10) }
      ]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { period: 'Morning (6am-12pm)', count: BigInt(5) }
      ]);
      mockPrisma.event.groupBy.mockResolvedValueOnce([
        { browser: 'Chrome', _count: 8 }
      ]);
      mockPrisma.event.findMany.mockResolvedValueOnce([]);

      const analytics = await service.getAnalytics(7);

      expect(analytics).toBeDefined();
      expect(analytics.eventStats).toBeDefined();
      expect(analytics.dailyEvents).toBeDefined();
      expect(analytics.timeOfDayStats).toBeDefined();
      expect(analytics.browserStats).toBeDefined();
      expect(analytics.frameworkStats).toBeDefined();
    });

    it('should call all required data sources', async () => {
      // Setup mocks
      mockPrisma.event.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.event.findMany.mockResolvedValue([]);

      await service.getAnalytics(7);
      
      // Verify all data sources were called
      expect(mockPrisma.event.groupBy).toHaveBeenCalled();
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(mockPrisma.event.findMany).toHaveBeenCalled();
    });

    it('should aggregate framework usage stats from metadata', async () => {
      // Mock framework events
      mockPrisma.event.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.event.findMany.mockResolvedValueOnce([
        {
          eventType: 'framework_view',
          metadata: JSON.stringify({ frameworkName: 'Chain of Thought' }),
        },
        {
          eventType: 'framework_view',
          metadata: JSON.stringify({ frameworkName: 'Chain of Thought' }),
        },
        {
          eventType: 'prompt_generate',
          metadata: JSON.stringify({ frameworkType: 'Chain of Thought' }),
        },
      ]);

      const analytics = await service.getAnalytics(7);
      
      const cotStats = analytics.frameworkStats.find(f => f.name === 'Chain of Thought');
      expect(cotStats).toBeDefined();
      expect(cotStats?.views).toBe(2);
      expect(cotStats?.generates).toBe(1);
      expect(cotStats?.total).toBe(3);
    });

    it('should handle invalid JSON metadata gracefully', async () => {
      mockPrisma.event.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.event.findMany.mockResolvedValueOnce([
        {
          eventType: 'framework_view',
          metadata: 'invalid json',
        },
        {
          eventType: 'framework_view',
          metadata: JSON.stringify({ frameworkName: 'Valid Framework' }),
        },
      ]);

      const analytics = await service.getAnalytics(7);
      
      // Should not throw and should include valid framework
      expect(analytics.frameworkStats).toBeDefined();
      const validFramework = analytics.frameworkStats.find(f => f.name === 'Valid Framework');
      expect(validFramework).toBeDefined();
    });

    it('should convert bigint counts to numbers', async () => {
      mockPrisma.event.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { date: '2025-12-22', count: BigInt(100) },
        { date: '2025-12-21', count: BigInt(50) },
      ]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { period: 'Morning (6am-12pm)', count: BigInt(30) },
      ]);
      mockPrisma.event.findMany.mockResolvedValue([]);

      const analytics = await service.getAnalytics(7);
      
      // Verify bigint conversion to number
      expect(analytics.dailyEvents[0].count).toBe(100);
      expect(typeof analytics.dailyEvents[0].count).toBe('number');
      expect(analytics.timeOfDayStats[0].count).toBe(30);
      expect(typeof analytics.timeOfDayStats[0].count).toBe('number');
    });

    it('should sort framework stats by total usage', async () => {
      mockPrisma.event.groupBy.mockResolvedValue([]);
      mockPrisma.$queryRaw.mockResolvedValue([]);
      mockPrisma.event.findMany.mockResolvedValueOnce([
        // Framework A: 5 total
        { eventType: 'framework_view', metadata: JSON.stringify({ frameworkName: 'Framework A' }) },
        { eventType: 'framework_view', metadata: JSON.stringify({ frameworkName: 'Framework A' }) },
        { eventType: 'framework_view', metadata: JSON.stringify({ frameworkName: 'Framework A' }) },
        { eventType: 'prompt_generate', metadata: JSON.stringify({ frameworkName: 'Framework A' }) },
        { eventType: 'prompt_generate', metadata: JSON.stringify({ frameworkName: 'Framework A' }) },
        // Framework B: 2 total
        { eventType: 'framework_view', metadata: JSON.stringify({ frameworkName: 'Framework B' }) },
        { eventType: 'framework_view', metadata: JSON.stringify({ frameworkName: 'Framework B' }) },
      ]);

      const analytics = await service.getAnalytics(7);
      
      expect(analytics.frameworkStats.length).toBe(2);
      // Framework A should be first (higher total)
      expect(analytics.frameworkStats[0].name).toBe('Framework A');
      expect(analytics.frameworkStats[0].total).toBe(5);
      expect(analytics.frameworkStats[1].name).toBe('Framework B');
      expect(analytics.frameworkStats[1].total).toBe(2);
    });
  });
});
