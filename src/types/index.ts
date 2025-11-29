import { PrismaClient } from '@prisma/client';

export const FREE_PROMPT_LIMIT = 5;

export type SubscriptionTier = 'free' | 'premium';

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  isPremium: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: Date | null;
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }

  interface FastifyRequest {
    user?: AuthUser;
    subscription?: SubscriptionInfo;
  }

  interface Session {
    userId?: string;
  }
}

export interface FrameworkField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number';
  placeholder?: string;
  required?: boolean;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  fields: FrameworkField[];
  examples?: {
    general: Record<string, string>;
    business: Record<string, string>;
  };
}
