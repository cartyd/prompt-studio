import { Template } from '../types';

/**
 * Base interface for common template metadata (eliminates data clumps)
 */
export interface BaseTemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'business' | 'technical' | 'creative';
}

/**
 * Specialized configuration interfaces for each template type
 */
export interface TotTemplateConfig extends BaseTemplateMetadata {
  role: string;
  objective: string;
  approaches?: string;
  criteria?: string[];
}

export interface SelfConsistencyConfig extends BaseTemplateMetadata {
  role: string;
  goal: string;
  versions?: string;
}

export interface CotTemplateConfig extends BaseTemplateMetadata {
  role: string;
  problem: string;
}

export interface RoleTemplateConfig extends BaseTemplateMetadata {
  role: string;
  task: string;
  tone?: string;
}

export interface ReflectionConfig extends BaseTemplateMetadata {
  role: string;
  task: string;
  criteria: string;
}

/**
 * Common template field configurations
 */
export const COMMON_ROLES = {
  CAREER_COUNSELOR: 'career counselor with 15 years experience',
  BUSINESS_ANALYST: 'strategic business analyst',
  SOFTWARE_ARCHITECT: 'senior software architect',
  PRODUCT_MANAGER: 'product manager',
  FINANCIAL_PLANNER: 'certified financial planner',
  PRICING_STRATEGIST: 'pricing strategist',
  OPERATIONS_MANAGER: 'operations manager',
  DATA_ANALYST: 'data analyst',
  TIME_MANAGEMENT_EXPERT: 'time management expert',
  PROJECT_MANAGER: 'project manager',
  SOFTWARE_ENGINEER: 'senior software engineer',
  MATH_TUTOR: 'mathematics tutor',
  COPYWRITER: 'senior copywriter specializing in conversion',
  CREATIVE_WRITER: 'award-winning author',
  TECHNICAL_WRITER: 'technical documentation specialist',
  WRITING_TUTOR: 'writing tutor',
  CODE_REVIEWER: 'senior code reviewer',
  BUSINESS_CONSULTANT: 'business development consultant',
} as const;

export const COMMON_CRITERIA = {
  TOT_BUSINESS: ['Cost/Resource Impact', 'Feasibility/Practicality', 'Innovation/Creativity', 'Risk/Safety'],
  TOT_TECHNICAL: ['Efficiency/Performance', 'Feasibility/Practicality', 'Completeness/Thoroughness', 'Risk/Safety'],
  TOT_PERSONAL: ['Cost/Resource Impact', 'Feasibility/Practicality', 'Risk/Safety', 'Completeness/Thoroughness'],
  TOT_PRODUCT: ['Cost/Resource Impact', 'Feasibility/Practicality', 'Innovation/Creativity', 'Efficiency/Performance'],
};

export const COMMON_TONES = {
  PERSUASIVE: 'Persuasive, benefit-focused, uses power words, creates urgency',
  CREATIVE: 'Creative, imaginative, and engaging with rich descriptive language',
  PROFESSIONAL: 'Clear, professional, and informative',
  REFLECTION: 'Clear structure, strong opening, data-driven, memorable conclusion',
} as const;

/**
 * Template factory functions for common patterns (simplified parameter lists)
 */
export function createTotTemplate(config: TotTemplateConfig): Template {
  return {
    ...config,
    fields: {
      role: config.role,
      objective: config.objective,
      approaches: config.approaches || '3',
      criteria: config.criteria || COMMON_CRITERIA.TOT_BUSINESS,
    },
  };
}

export function createSelfConsistencyTemplate(config: SelfConsistencyConfig): Template {
  return {
    ...config,
    fields: {
      role: config.role,
      goal: config.goal,
      versions: config.versions || '3',
    },
  };
}

export function createCotTemplate(config: CotTemplateConfig): Template {
  return {
    ...config,
    fields: {
      role: config.role,
      problem: config.problem,
    },
  };
}

export function createRoleTemplate(config: RoleTemplateConfig): Template {
  return {
    ...config,
    fields: {
      role: config.role,
      task: config.task,
      tone: config.tone || COMMON_TONES.PROFESSIONAL,
    },
  };
}

export function createReflectionTemplate(config: ReflectionConfig): Template {
  return {
    ...config,
    fields: {
      role: config.role,
      task: config.task,
      criteria: config.criteria,
    },
  };
}