import crypto from 'crypto';
import * as Prisma from '@prisma/client';
import { TOKEN_CONSTANTS } from '../constants';

export type TokenType = 'email_verification' | 'password_reset';

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(TOKEN_CONSTANTS.TOKEN_BYTE_LENGTH).toString('hex');
}

/**
 * Create a verification token in the database
 */
export async function createVerificationToken(
  prisma: Prisma.PrismaClient,
  userId: string,
  type: TokenType
): Promise<string> {
  const token = generateSecureToken();
  const expiryHours =
    type === 'email_verification'
      ? TOKEN_CONSTANTS.EMAIL_VERIFICATION_EXPIRY_HOURS
      : TOKEN_CONSTANTS.PASSWORD_RESET_EXPIRY_HOURS;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  // Delete any existing tokens of the same type for this user
  await prisma.verificationToken.deleteMany({
    where: {
      userId,
      type,
    },
  });

  // Create new token
  await prisma.verificationToken.create({
    data: {
      userId,
      token,
      type,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validate and consume a verification token
 * Returns the userId if valid, null otherwise
 */
export async function validateAndConsumeToken(
  prisma: Prisma.PrismaClient,
  token: string,
  type: TokenType
): Promise<string | null> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return null;
  }

  // Check if token is of the correct type
  if (verificationToken.type !== type) {
    return null;
  }

  // Check if token is expired
  if (verificationToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    });
    return null;
  }

  // Token is valid - delete it (one-time use) and return userId
  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  return verificationToken.userId;
}

/**
 * Clean up expired tokens (can be run as a scheduled job)
 */
export async function cleanupExpiredTokens(prisma: Prisma.PrismaClient): Promise<number> {
  const result = await prisma.verificationToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}
