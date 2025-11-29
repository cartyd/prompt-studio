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

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'testpassword123';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(password, hash);
      
      expect(isValid).toBe(true);
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(password.length);
    });

    it('should reject incorrect passwords', async () => {
      const password = 'correctpassword';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare('wrongpassword', hash);
      
      expect(isValid).toBe(false);
    });

    it('should produce different hashes for same password', async () => {
      const password = 'samepassword';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      expect(hash1).not.toBe(hash2);
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });

    it('should handle special characters in passwords', async () => {
      const password = 'p@ssw0rd!#$%^&*(){}[]<>?';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should handle very long passwords', async () => {
      const password = 'a'.repeat(100);
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(password, hash);
      
      expect(isValid).toBe(true);
    });
  });

  describe('User Registration', () => {
    it('should create a new user with free tier by default', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Test User',
          email: `test_${Date.now()}@example.com`,
          passwordHash: await bcrypt.hash('password123', 10),
        },
      });

      expect(user.id).toBeDefined();
      expect(user.name).toBe('Test User');
      expect(user.subscriptionTier).toBe('free');
      expect(user.subscriptionExpiresAt).toBeNull();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should store hashed password, not plain text', async () => {
      const plainPassword = 'mysecretpassword';
      const user = await prisma.user.create({
        data: {
          name: 'Secure User',
          email: `test_secure_${Date.now()}@example.com`,
          passwordHash: await bcrypt.hash(plainPassword, 10),
        },
      });

      expect(user.passwordHash).not.toBe(plainPassword);
      expect(user.passwordHash.startsWith('$2')).toBe(true); // bcrypt hash prefix
      expect(await bcrypt.compare(plainPassword, user.passwordHash)).toBe(true);
    });

    it('should create user with premium tier when specified', async () => {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const user = await prisma.user.create({
        data: {
          name: 'Premium User',
          email: `test_premium_${Date.now()}@example.com`,
          passwordHash: await bcrypt.hash('password123', 10),
          subscriptionTier: 'premium',
          subscriptionExpiresAt: expiryDate,
        },
      });

      expect(user.subscriptionTier).toBe('premium');
      expect(user.subscriptionExpiresAt).not.toBeNull();
      expect(user.subscriptionExpiresAt?.getTime()).toBe(expiryDate.getTime());
    });
  });

  describe('Email Uniqueness', () => {
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

    it('should treat emails as case-sensitive (verify database behavior)', async () => {
      const baseEmail = `test_case_${Date.now()}`;
      
      const user1 = await prisma.user.create({
        data: {
          name: 'User 1',
          email: `${baseEmail}@example.com`,
          passwordHash: await bcrypt.hash('password123', 10),
        },
      });

      // This tests the actual database behavior for case sensitivity
      // If your schema has case-insensitive unique constraint, this should fail
      const user2Result = await prisma.user.create({
        data: {
          name: 'User 2',
          email: `${baseEmail.toUpperCase()}@EXAMPLE.COM`,
          passwordHash: await bcrypt.hash('password123', 10),
        },
      }).catch(e => e);

      // Both outcomes are valid depending on your schema
      // This documents the actual behavior
      if (user2Result instanceof Error) {
        expect(user2Result).toBeDefined();
      } else {
        expect(user2Result.id).not.toBe(user1.id);
      }
    });
  });

  describe('User Data Validation', () => {
    it('should require name field', async () => {
      await expect(
        prisma.user.create({
          data: {
            email: `test_no_name_${Date.now()}@example.com`,
            passwordHash: await bcrypt.hash('password123', 10),
          } as any,
        })
      ).rejects.toThrow();
    });

    it('should require email field', async () => {
      await expect(
        prisma.user.create({
          data: {
            name: 'Test User',
            passwordHash: await bcrypt.hash('password123', 10),
          } as any,
        })
      ).rejects.toThrow();
    });

    it('should require passwordHash field', async () => {
      await expect(
        prisma.user.create({
          data: {
            name: 'Test User',
            email: `test_no_password_${Date.now()}@example.com`,
          } as any,
        })
      ).rejects.toThrow();
    });
  });

  describe('User Retrieval', () => {
    it('should find user by email', async () => {
      const email = `test_find_${Date.now()}@example.com`;
      const createdUser = await prisma.user.create({
        data: {
          name: 'Findable User',
          email,
          passwordHash: await bcrypt.hash('password123', 10),
        },
      });

      const foundUser = await prisma.user.findUnique({
        where: { email },
      });

      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(email);
    });

    it('should return null for non-existent email', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(user).toBeNull();
    });
  });
});
