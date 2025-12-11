import { describe, it, expect } from '@jest/globals';
import { getSubscriptionInfo } from '../src/plugins/auth';
import { AuthUser } from '../src/types';

describe('Subscription Info', () => {
  describe('Premium Subscription', () => {
    it('should return premium status for valid premium subscription', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const user: AuthUser = {
        id: '1',
        name: 'Premium User',
        email: 'premium@example.com',
        passwordHash: 'hash',
        lastPasswordChange: new Date(),
        isAdmin: false,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: futureDate,
        createdAt: new Date(),
      };

      const result = getSubscriptionInfo(user);

      expect(result.tier).toBe('premium');
      expect(result.isPremium).toBe(true);
    });

    it('should return premium for subscription expiring today (still valid)', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      const user: AuthUser = {
        id: '2',
        name: 'Expiring User',
        email: 'expiring@example.com',
        passwordHash: 'hash',
        lastPasswordChange: new Date(),
        isAdmin: false,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: today,
        createdAt: new Date(),
      };

      const result = getSubscriptionInfo(user);

      // If expiry is in the future (even seconds), should still be premium
      if (today > new Date()) {
        expect(result.tier).toBe('premium');
        expect(result.isPremium).toBe(true);
      } else {
        // If already expired, should be free
        expect(result.tier).toBe('free');
        expect(result.isPremium).toBe(false);
      }
    });

    it('should return free status for expired premium subscription', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const user: AuthUser = {
        id: '3',
        name: 'Expired User',
        email: 'expired@example.com',
        passwordHash: 'hash',
        lastPasswordChange: new Date(),
        isAdmin: false,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: pastDate,
        createdAt: new Date(),
      };

      const result = getSubscriptionInfo(user);

      expect(result.tier).toBe('free');
      expect(result.isPremium).toBe(false);
    });

    it('should return free status for premium tier with null expiry date', () => {
      const user: AuthUser = {
        id: '4',
        name: 'No Expiry User',
        email: 'noexpiry@example.com',
        passwordHash: 'hash',
        lastPasswordChange: new Date(),
        isAdmin: false,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: null,
        createdAt: new Date(),
      };

      const result = getSubscriptionInfo(user);

      expect(result.tier).toBe('free');
      expect(result.isPremium).toBe(false);
    });
  });

  describe('Free Subscription', () => {
    it('should return free status for free tier user', () => {
      const user: AuthUser = {
        id: '5',
        name: 'Free User',
        email: 'free@example.com',
        passwordHash: 'hash',
        lastPasswordChange: new Date(),
        isAdmin: false,
        subscriptionTier: 'free',
        subscriptionExpiresAt: null,
        createdAt: new Date(),
      };

      const result = getSubscriptionInfo(user);

      expect(result.tier).toBe('free');
      expect(result.isPremium).toBe(false);
    });

    it('should return free status even if free tier has future expiry date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const user: AuthUser = {
        id: '6',
        name: 'Free User With Date',
        email: 'free-date@example.com',
        passwordHash: 'hash',
        lastPasswordChange: new Date(),
        isAdmin: false,
        subscriptionTier: 'free',
        subscriptionExpiresAt: futureDate,
        createdAt: new Date(),
      };

      const result = getSubscriptionInfo(user);

      // Free tier should always return free, regardless of expiry date
      expect(result.tier).toBe('free');
      expect(result.isPremium).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle subscription expiring far in the future', () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 10);

      const user: AuthUser = {
        id: '7',
        name: 'Long Term User',
        email: 'longterm@example.com',
        passwordHash: 'hash',
        lastPasswordChange: new Date(),
        isAdmin: false,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: farFuture,
        createdAt: new Date(),
      };

      const result = getSubscriptionInfo(user);

      expect(result.tier).toBe('premium');
      expect(result.isPremium).toBe(true);
    });

    it('should handle subscription expired long ago', () => {
      const farPast = new Date();
      farPast.setFullYear(farPast.getFullYear() - 5);

      const user: AuthUser = {
        id: '8',
        name: 'Long Expired User',
        email: 'longexpired@example.com',
        passwordHash: 'hash',
        lastPasswordChange: new Date(),
        isAdmin: false,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: farPast,
        createdAt: new Date(),
      };

      const result = getSubscriptionInfo(user);

      expect(result.tier).toBe('free');
      expect(result.isPremium).toBe(false);
    });

    it('should verify tier matches isPremium flag', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const premiumUser: AuthUser = {
        id: '9',
        name: 'Premium User',
        email: 'premium2@example.com',
        passwordHash: 'hash',
        lastPasswordChange: new Date(),
        isAdmin: false,
        subscriptionTier: 'premium',
        subscriptionExpiresAt: futureDate,
        createdAt: new Date(),
      };

      const freeUser: AuthUser = {
        id: '10',
        name: 'Free User',
        email: 'free2@example.com',
        passwordHash: 'hash',
        lastPasswordChange: new Date(),
        isAdmin: false,
        subscriptionTier: 'free',
        subscriptionExpiresAt: null,
        createdAt: new Date(),
      };

      const premiumResult = getSubscriptionInfo(premiumUser);
      const freeResult = getSubscriptionInfo(freeUser);

      // Verify consistency between tier and isPremium
      expect(premiumResult.tier === 'premium').toBe(premiumResult.isPremium);
      expect(freeResult.tier === 'premium').toBe(freeResult.isPremium);
    });
  });
});
