import * as Prisma from '@prisma/client';

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
  passwordHash: string;
  lastPasswordChange: Date;
  isAdmin: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: Prisma.PrismaClient;
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

// Wizard types
export interface WizardQuestion {
  id: string;
  text: string;
  description?: string;
  type: 'single-choice' | 'multiple-choice';
  options: WizardOption[];
}

export interface WizardOption {
  id: string;
  text: string;
  description?: string;
  icon?: string;
  weights: {
    tot?: number;
    cot?: number;
    'self-consistency'?: number;
    role?: number;
    reflection?: number;
  };
}

export interface WizardAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

export interface WizardRecommendation {
  frameworkId: string;
  frameworkName: string;
  confidence: number;
  explanation: string;
  whyChosen: string[];
  prepopulateData?: Record<string, string>;
}

export interface WizardSession {
  answers: WizardAnswer[];
  currentStep: number;
  startedAt: Date;
}

declare module 'fastify' {
  interface Session {
    userId?: string;
    wizardSession?: WizardSession;
  }
}
