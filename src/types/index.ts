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
    csrfProtection(request: any, reply: any, done: () => void): void;
  }

  interface FastifyRequest {
    user?: AuthUser;
    subscription?: SubscriptionInfo;
    generateCsrf(): Promise<string>;
  }

  interface FastifyReply {
    generateCsrf(): Promise<string>;
    viewWithCsrf(page: string, data?: Record<string, any>): Promise<void>;
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
  optional?: boolean;
  defaultValue?: string | string[];
  options?: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'business' | 'technical' | 'creative';
  fields: Record<string, string | string[]>;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  fields: FrameworkField[];
  templates?: Template[];
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
