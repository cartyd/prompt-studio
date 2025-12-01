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
  type: 'text' | 'textarea' | 'number' | 'multi-select-criteria';
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  fields: FrameworkField[];
  examples?: {
    general: Record<string, string | string[]>;
    business: Record<string, string | string[]>;
  };
}

export interface CustomCriteria {
  id: string;
  userId: string;
  criteriaName: string;
  createdAt: Date;
}

export const DEFAULT_EVALUATION_CRITERIA = [
  'Accuracy/Correctness',
  'Clarity/Coherence',
  'Feasibility/Practicality',
  'Efficiency/Performance',
  'Completeness/Thoroughness',
  'Innovation/Creativity',
  'Risk/Safety',
  'Cost/Resource Impact',
] as const;
