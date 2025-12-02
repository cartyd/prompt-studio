import { PrismaClient } from '@prisma/client';

export type EventType = 'login' | 'framework_view' | 'prompt_generate' | 'prompt_save';

export interface EventMetadata {
  frameworkId?: string;
  frameworkType?: string;
  promptId?: string;
  [key: string]: any;
}

/**
 * Log an analytics event to the database
 * @param prisma - Prisma client instance
 * @param userId - User ID (optional for anonymous events)
 * @param eventType - Type of event
 * @param metadata - Additional event data
 */
export async function logEvent(
  prisma: PrismaClient,
  userId: string | undefined,
  eventType: EventType,
  metadata?: EventMetadata
): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        userId: userId || null,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Silently fail - don't let analytics break the app
    console.error('Failed to log analytics event:', error);
  }
}
