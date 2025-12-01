import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { validateAndGenerate } from '../src/prompt-generators';

const prisma = new PrismaClient();

describe('Custom Criteria Database', () => {
  let premiumUserId: string;
  let freeUserId: string;

  beforeAll(async () => {
    // Clean up database
    await prisma.customCriteria.deleteMany();
    await prisma.prompt.deleteMany();
    await prisma.user.deleteMany();

    // Create premium user
    const premiumExpiresAt = new Date();
    premiumExpiresAt.setDate(premiumExpiresAt.getDate() + 30);

    const premiumUser = await prisma.user.create({
      data: {
        name: 'Premium User',
        email: 'premium@example.com',
        passwordHash: 'hash',
        subscriptionTier: 'premium',
        subscriptionExpiresAt: premiumExpiresAt,
      },
    });
    premiumUserId = premiumUser.id;

    // Create free user
    const freeUser = await prisma.user.create({
      data: {
        name: 'Free User',
        email: 'free@example.com',
        passwordHash: 'hash',
        subscriptionTier: 'free',
      },
    });
    freeUserId = freeUser.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create custom criteria for premium user', async () => {
    const criteria = await prisma.customCriteria.create({
      data: {
        userId: premiumUserId,
        criteriaName: 'My Custom Criteria',
      },
    });

    expect(criteria.id).toBeDefined();
    expect(criteria.criteriaName).toBe('My Custom Criteria');
    expect(criteria.userId).toBe(premiumUserId);
  });

  it('should enforce unique constraint on userId and criteriaName', async () => {
    await prisma.customCriteria.create({
      data: {
        userId: premiumUserId,
        criteriaName: 'Duplicate',
      },
    });

    await expect(
      prisma.customCriteria.create({
        data: {
          userId: premiumUserId,
          criteriaName: 'Duplicate',
        },
      })
    ).rejects.toThrow();
  });

  it('should allow same criteria name for different users', async () => {
    const criteria1 = await prisma.customCriteria.create({
      data: {
        userId: premiumUserId,
        criteriaName: 'Same Name',
      },
    });

    const criteria2 = await prisma.customCriteria.create({
      data: {
        userId: freeUserId,
        criteriaName: 'Same Name',
      },
    });

    expect(criteria1.id).not.toBe(criteria2.id);
    expect(criteria1.criteriaName).toBe(criteria2.criteriaName);
  });

  it('should delete custom criteria', async () => {
    const criteria = await prisma.customCriteria.create({
      data: {
        userId: premiumUserId,
        criteriaName: 'To Delete',
      },
    });

    await prisma.customCriteria.delete({
      where: { id: criteria.id },
    });

    const deleted = await prisma.customCriteria.findUnique({
      where: { id: criteria.id },
    });

    expect(deleted).toBeNull();
  });

  it('should cascade delete when user is deleted', async () => {
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test_cascade_${Date.now()}@example.com`,
        passwordHash: 'hash',
        subscriptionTier: 'premium',
      },
    });

    await prisma.customCriteria.create({
      data: {
        userId: testUser.id,
        criteriaName: 'Will Be Deleted',
      },
    });

    await prisma.user.delete({
      where: { id: testUser.id },
    });

    const criteria = await prisma.customCriteria.findMany({
      where: { userId: testUser.id },
    });

    expect(criteria).toHaveLength(0);
  });
});

describe('Tree-of-Thought with Criteria Arrays', () => {
  it('should generate prompt with array of criteria', () => {
    const result = validateAndGenerate('tot', {
      role: 'problem solver',
      objective: 'solve the problem',
      approaches: '3',
      criteria: ['Accuracy', 'Speed', 'Cost'],
    });

    expect(result).toContain('(1) Accuracy');
    expect(result).toContain('(2) Speed');
    expect(result).toContain('(3) Cost');
  });

  it('should handle string criteria for backward compatibility', () => {
    const result = validateAndGenerate('tot', {
      role: 'problem solver',
      objective: 'solve the problem',
      approaches: '3',
      criteria: 'Accuracy, Speed, Cost',
    });

    expect(result).toContain('Accuracy, Speed, Cost');
  });
});
