import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

describe('Authentication', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { startsWith: 'test_' } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should hash passwords correctly', async () => {
    const password = 'testpassword123';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    
    expect(isValid).toBe(true);
  });

  it('should create a new user with free tier', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test_${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });

    expect(user.subscriptionTier).toBe('free');
    expect(user.subscriptionExpiresAt).toBeNull();
  });

  it('should not allow duplicate email registration', async () => {
    const email = `test_duplicate_${Date.now()}@example.com`;
    
    await prisma.user.create({
      data: {
        name: 'User 1',
        email,
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });

    await expect(
      prisma.user.create({
        data: {
          name: 'User 2',
          email,
          passwordHash: await bcrypt.hash('password123', 10),
        },
      })
    ).rejects.toThrow();
  });
});
