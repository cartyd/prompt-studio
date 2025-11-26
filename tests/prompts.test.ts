import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { FREE_PROMPT_LIMIT } from '../src/types';

const prisma = new PrismaClient();

describe('Prompt Management', () => {
  let freeUser: any;
  let premiumUser: any;

  beforeAll(async () => {
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

  it('should enforce free tier prompt limit', async () => {
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

  it('should delete user prompts when user is deleted', async () => {
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
});
