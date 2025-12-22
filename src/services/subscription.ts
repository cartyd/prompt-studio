import { PrismaClient } from '@prisma/client';
import { TIME_CONSTANTS, USER_CONSTANTS } from '../constants';

/**
 * Service for subscription-related operations
 * Handles subscription upgrades, downgrades, and expiration logic
 */
export class SubscriptionService {
  /**
   * Grant premium subscription to a user
   * @param prisma - Prisma client instance
   * @param userId - User ID to grant premium to
   * @param durationDays - Number of days for the subscription (optional, defaults to constant)
   */
  static async grantPremium(
    prisma: PrismaClient,
    userId: string,
    durationDays?: number
  ): Promise<void> {
    const days = durationDays || TIME_CONSTANTS.PREMIUM_SUBSCRIPTION_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: USER_CONSTANTS.SUBSCRIPTION_TIERS.PREMIUM,
        subscriptionExpiresAt: expiresAt,
      },
    });
  }

  /**
   * Revoke premium subscription from a user
   * @param prisma - Prisma client instance
   * @param userId - User ID to revoke premium from
   */
  static async revokePremium(
    prisma: PrismaClient,
    userId: string
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: USER_CONSTANTS.SUBSCRIPTION_TIERS.FREE,
        subscriptionExpiresAt: null,
      },
    });
  }

  /**
   * Toggle user's premium status
   * @param prisma - Prisma client instance
   * @param userId - User ID to toggle
   * @param yearsDuration - Duration in years if granting premium
   * @returns New subscription tier
   */
  static async togglePremium(
    prisma: PrismaClient,
    userId: string,
    yearsDuration: number = TIME_CONSTANTS.PREMIUM_SUBSCRIPTION_YEARS
  ): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPremium = user.subscriptionTier === USER_CONSTANTS.SUBSCRIPTION_TIERS.PREMIUM;
    const newTier = isPremium 
      ? USER_CONSTANTS.SUBSCRIPTION_TIERS.FREE 
      : USER_CONSTANTS.SUBSCRIPTION_TIERS.PREMIUM;
    
    const expiresAt = isPremium
      ? null
      : new Date(Date.now() + yearsDuration * 365 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: newTier,
        subscriptionExpiresAt: expiresAt,
      },
    });

    return newTier;
  }

  /**
   * Check if a user's subscription has expired
   * @param expiresAt - Subscription expiration date
   * @returns True if expired, false otherwise
   */
  static isExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    return new Date() > expiresAt;
  }
}
