import * as Prisma from '@prisma/client';
import { FastifyRequest } from 'fastify';
import { extractRequestMetadata } from './analytics-helpers';

export type EventType = 'login' | 'framework_view' | 'prompt_generate' | 'prompt_save' | 'password_changed';

export interface EventMetadata {
  frameworkId?: string;
  frameworkType?: string;
  promptId?: string;
  [key: string]: any;
}

/**
 * Log an analytics event to the database
 * @param prisma - Prisma client instance
 * @param request - Fastify request object for extracting user agent and IP
 * @param userId - User ID (optional for anonymous events)
 * @param eventType - Type of event
 * @param metadata - Additional event data
 */
export async function logEvent(
  prisma: Prisma.PrismaClient,
  request: FastifyRequest,
  userId: string | undefined,
  eventType: EventType,
  metadata?: EventMetadata
): Promise<void> {
  try {
    // Extract request metadata (user agent, device type, IP, location)
    const requestMetadata = extractRequestMetadata(request);

    await prisma.event.create({
      data: {
        userId: userId || null,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
        // Traffic source tracking
        userAgent: requestMetadata.userAgent,
        deviceType: requestMetadata.deviceType,
        browser: requestMetadata.browser,
        os: requestMetadata.os,
        // Geographic tracking
        ipAddress: requestMetadata.ipAddress,
        country: requestMetadata.country,
        region: requestMetadata.region,
        city: requestMetadata.city,
      },
    });
  } catch (error) {
    // Silently fail - don't let analytics break the app
    console.error('Failed to log analytics event:', error);
  }
}
