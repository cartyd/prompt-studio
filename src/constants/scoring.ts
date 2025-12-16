/**
 * Application constants to eliminate magic numbers and improve maintainability
 * Extracted from various modules to centralize configuration values
 */

// ==========  SCORING CONSTANTS  ==========

/**
 * Score boundaries and base values
 */
export const SCORE_BOUNDS = {
  MIN: 0,
  MAX: 100,
  BASE: 50,
  PERCENTAGE_MULTIPLIER: 100,
} as const;

/**
 * Confidence thresholds for recommendations
 */
export const CONFIDENCE_THRESHOLDS = {
  LOW: 50,
  MEDIUM: 70,
  HIGH: 85,
  ALTERNATIVE_CUTOFF: 50,  // Show alternatives if confidence <= this value
} as const;

/**
 * Framework scoring adjustments
 */
export const SCORING_ADJUSTMENTS = {
  MINOR: 5,
  MODERATE: 10,
  SIGNIFICANT: 15,
  MAJOR: 20,
  CRITICAL: 25,
} as const;

/**
 * Experience and proficiency score mappings
 */
export const PROFICIENCY_SCORES = {
  BEGINNER: 0.3,
  INTERMEDIATE: 0.5,
  EXPERIENCED: 0.7,
  EXPERT: 0.9,
  DEFAULT: 0.5,
} as const;

/**
 * Complexity level mappings
 */
export const COMPLEXITY_SCORES = {
  VERY_LOW: 0.2,
  LOW: 0.4,
  MEDIUM: 0.5,
  HIGH: 0.7,
  VERY_HIGH: 0.8,
  EXTREME: 0.9,
  DEFAULT: 0.5,
} as const;

/**
 * Clarity level mappings
 */
export const CLARITY_SCORES = {
  UNCLEAR: 0.2,
  SOMEWHAT_CLEAR: 0.5,
  CLEAR: 0.7,
  VERY_CLEAR: 0.9,
  DEFAULT: 0.5,
} as const;

/**
 * Creativity level mappings
 */
export const CREATIVITY_SCORES = {
  NOT_CREATIVE: 0.2,
  SOMEWHAT_CREATIVE: 0.5,
  CREATIVE: 0.7,
  HIGHLY_CREATIVE: 0.9,
  DEFAULT: 0.5,
} as const;

// ==========  UI/UX CONSTANTS  ==========

/**
 * Common spacing values used throughout the application
 */
export const SPACING = {
  XS: '0.5rem',    // 8px
  SM: '0.75rem',   // 12px  
  MD: '1rem',      // 16px
  LG: '1.5rem',    // 24px
  XL: '2rem',      // 32px
  XXL: '2.5rem',   // 40px
  XXXL: '3rem',    // 48px
} as const;

/**
 * Font size scale
 */
export const FONT_SIZES = {
  XS: '0.75rem',   // 12px
  SM: '0.875rem',  // 14px
  BASE: '1rem',    // 16px
  LG: '1.125rem',  // 18px
  XL: '1.25rem',   // 20px
  XXL: '1.5rem',   // 24px
  XXXL: '2rem',    // 32px
} as const;

/**
 * Border radius values
 */
export const BORDER_RADIUS = {
  SM: '4px',
  MD: '8px', 
  LG: '12px',
  XL: '16px',
  ROUND: '50%',
} as const;

// ==========  FRAMEWORK CONSTANTS  ==========

/**
 * Framework identification constants
 */
export const FRAMEWORK_IDS = {
  TREE_OF_THOUGHT: 'tot',
  CHAIN_OF_THOUGHT: 'cot',
  SELF_CONSISTENCY: 'self-consistency',
  ROLE_PROMPTING: 'role',
  REFLECTION: 'reflection',
} as const;

/**
 * Default framework roles
 */
export const DEFAULT_FRAMEWORK_ROLES = {
  [FRAMEWORK_IDS.TREE_OF_THOUGHT]: 'expert problem solver',
  [FRAMEWORK_IDS.CHAIN_OF_THOUGHT]: 'logical thinker',
  [FRAMEWORK_IDS.SELF_CONSISTENCY]: 'analytical reasoner',
  [FRAMEWORK_IDS.ROLE_PROMPTING]: 'professional expert',
  [FRAMEWORK_IDS.REFLECTION]: 'critical editor',
} as const;

// ==========  VALIDATION CONSTANTS  ==========

/**
 * Limits and constraints
 */
export const LIMITS = {
  MAX_FRAMEWORK_APPROACHES: 5,
  MAX_FRAMEWORK_VERSIONS: 5,
  DEFAULT_APPROACHES: 3,
  DEFAULT_VERSIONS: 3,
  MAX_ALTERNATIVES: 3,
} as const;

// ==========  UTILITY FUNCTIONS  ==========

/**
 * Ensures a score stays within valid bounds (0-100)
 */
export function clampScore(score: number): number {
  return Math.max(SCORE_BOUNDS.MIN, Math.min(SCORE_BOUNDS.MAX, score));
}

/**
 * Converts a decimal ratio to a percentage (0.75 -> 75)
 */
export function toPercentage(ratio: number): number {
  return Math.round(ratio * SCORE_BOUNDS.PERCENTAGE_MULTIPLIER);
}

/**
 * Gets proficiency score with fallback to default
 */
export function getProficiencyScore(level: string): number {
  const scoreMap: Record<string, number> = {
    'beginner': PROFICIENCY_SCORES.BEGINNER,
    'intermediate': PROFICIENCY_SCORES.INTERMEDIATE,
    'experienced': PROFICIENCY_SCORES.EXPERIENCED,
    'expert': PROFICIENCY_SCORES.EXPERT,
  };
  return scoreMap[level] || PROFICIENCY_SCORES.DEFAULT;
}

/**
 * Gets clarity score with fallback to default
 */
export function getClarityScore(level: string): number {
  const scoreMap: Record<string, number> = {
    'unclear': CLARITY_SCORES.UNCLEAR,
    'somewhat-clear': CLARITY_SCORES.SOMEWHAT_CLEAR,
    'clear': CLARITY_SCORES.CLEAR,
    'very-clear': CLARITY_SCORES.VERY_CLEAR,
  };
  return scoreMap[level] || CLARITY_SCORES.DEFAULT;
}

/**
 * Gets creativity score with fallback to default
 */
export function getCreativityScore(level: string): number {
  const scoreMap: Record<string, number> = {
    'not-creative': CREATIVITY_SCORES.NOT_CREATIVE,
    'somewhat-creative': CREATIVITY_SCORES.SOMEWHAT_CREATIVE,
    'creative': CREATIVITY_SCORES.CREATIVE,
    'highly-creative': CREATIVITY_SCORES.HIGHLY_CREATIVE,
  };
  return scoreMap[level] || CREATIVITY_SCORES.DEFAULT;
}

/**
 * Gets complexity score with fallback to default
 */
export function getComplexityScore(problemType: string): number {
  const complexityMap: Record<string, number> = {
    'analytical': COMPLEXITY_SCORES.HIGH,
    'decision': COMPLEXITY_SCORES.VERY_HIGH,
    'creative': COMPLEXITY_SCORES.MEDIUM,
    'content': COMPLEXITY_SCORES.LOW,
    'other': COMPLEXITY_SCORES.DEFAULT,
  };
  return complexityMap[problemType] || COMPLEXITY_SCORES.DEFAULT;
}

/**
 * Gets objective/output type score
 */
export function getObjectiveScore(outputType: string): number {
  const objectiveMap: Record<string, number> = {
    'analysis': COMPLEXITY_SCORES.VERY_HIGH,
    'decision': COMPLEXITY_SCORES.HIGH,
    'content': COMPLEXITY_SCORES.LOW,
    'creative': PROFICIENCY_SCORES.BEGINNER,
    'other': COMPLEXITY_SCORES.DEFAULT,
  };
  return objectiveMap[outputType] || COMPLEXITY_SCORES.DEFAULT;
}