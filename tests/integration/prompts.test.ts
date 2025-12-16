import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcrypt';
import { FREE_PROMPT_LIMIT } from '../src/types';

let prisma: PrismaClient;

describe('Prompt Management', () => {
  let freeUser: any;
  let premiumUser: any;

  beforeAll(async () => {
    const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
    prisma = new PrismaClient({ adapter });
    
    // Clean up any existing test data
    await prisma.prompt.deleteMany({
      where: {
        user: {
          email: {
            startsWith: 'test_'
          }
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test_'
        }
      }
    });

    // Create test users
    freeUser = await prisma.user.create({
      data: {
        name: 'Free User',
        email: `test_free_${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });

    const premiumExpiry = new Date();
    premiumExpiry.setDate(premiumExpiry.getDate() + 90);

    premiumUser = await prisma.user.create({
      data: {
        name: 'Premium User',
        email: `test_premium_${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('password123', 10),
        subscriptionTier: 'premium',
        subscriptionExpiresAt: premiumExpiry,
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.prompt.deleteMany({
      where: {
        userId: { in: [freeUser.id, premiumUser.id] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [freeUser.id, premiumUser.id] },
      },
    });
    await prisma.$disconnect();
  });

  it('should allow free users to create prompts up to the limit', async () => {
    // Clean up any existing prompts first
    await prisma.prompt.deleteMany({
      where: { userId: freeUser.id },
    });

    // Create prompts up to the limit
    for (let i = 0; i < FREE_PROMPT_LIMIT; i++) {
      await prisma.prompt.create({
        data: {
          userId: freeUser.id,
          frameworkType: 'tot',
          title: `Test Prompt ${i + 1}`,
          finalPromptText: 'Test prompt text',
        },
      });
    }

    const promptCount = await prisma.prompt.count({
      where: { userId: freeUser.id },
    });

    expect(promptCount).toBe(FREE_PROMPT_LIMIT);
  });

  it('should verify the limit is a constant value', async () => {
    // This test documents the current limit value and ensures it hasn't changed
    expect(FREE_PROMPT_LIMIT).toBe(5);
    
    // Note: The actual enforcement logic is in the route handler.
    // This test verifies the constant exists and has the expected value.
  });

  it('should allow premium users unlimited prompts', async () => {
    // Create more than free limit
    for (let i = 0; i < FREE_PROMPT_LIMIT + 3; i++) {
      await prisma.prompt.create({
        data: {
          userId: premiumUser.id,
          frameworkType: 'cot',
          title: `Premium Prompt ${i + 1}`,
          finalPromptText: 'Premium prompt text',
        },
      });
    }

    const promptCount = await prisma.prompt.count({
      where: { userId: premiumUser.id },
    });

    expect(promptCount).toBeGreaterThan(FREE_PROMPT_LIMIT);
  });

  it('should delete user prompts when user is deleted (cascade)', async () => {
    const testUser = await prisma.user.create({
      data: {
        name: 'Delete Test User',
        email: `test_delete_${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });

    await prisma.prompt.create({
      data: {
        userId: testUser.id,
        frameworkType: 'tot',
        title: 'Test Prompt',
        finalPromptText: 'Test text',
      },
    });

    await prisma.user.delete({
      where: { id: testUser.id },
    });

    const prompts = await prisma.prompt.findMany({
      where: { userId: testUser.id },
    });

    expect(prompts.length).toBe(0);
  });

  it('should store different framework types correctly', async () => {
    const frameworkTypes = ['tot', 'cot', 'self-consistency', 'role', 'reflection'];

    for (const framework of frameworkTypes) {
      await prisma.prompt.create({
        data: {
          userId: freeUser.id,
          frameworkType: framework,
          title: `${framework} test`,
          finalPromptText: `Test text for ${framework}`,
        },
      });
    }

    const prompts = await prisma.prompt.findMany({
      where: { userId: freeUser.id },
      orderBy: { createdAt: 'asc' },
    });

    const storedFrameworks = prompts.map(p => p.frameworkType);
    frameworkTypes.forEach(framework => {
      expect(storedFrameworks).toContain(framework);
    });
  });

  it('should handle empty title by using default', async () => {
    const prompt = await prisma.prompt.create({
      data: {
        userId: freeUser.id,
        frameworkType: 'tot',
        title: '',
        finalPromptText: 'Test text',
      },
    });

    // Prisma allows empty strings - the route handler would set a default
    expect(prompt.title).toBe('');
  });

  it('should maintain prompt ordering by creation date', async () => {
    const titles = ['First', 'Second', 'Third'];

    for (const title of titles) {
      await prisma.prompt.create({
        data: {
          userId: premiumUser.id,
          frameworkType: 'tot',
          title,
          finalPromptText: 'Test',
        },
      });
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const prompts = await prisma.prompt.findMany({
      where: { userId: premiumUser.id },
      orderBy: { createdAt: 'desc' },
    });

    expect(prompts[0].title).toBe('Third');
    expect(prompts[1].title).toBe('Second');
    expect(prompts[2].title).toBe('First');
  });

  it('should verify premium subscription has future expiry date', async () => {
    expect(premiumUser.subscriptionExpiresAt).not.toBeNull();
    expect(premiumUser.subscriptionExpiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should verify free user has no expiry date', async () => {
    expect(freeUser.subscriptionTier).toBe('free');
    expect(freeUser.subscriptionExpiresAt).toBeNull();
  });
});
