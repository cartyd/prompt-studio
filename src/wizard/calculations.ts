import { Framework } from '../types/index';
import { 
  SCORE_BOUNDS, 
  SCORING_ADJUSTMENTS,
  clampScore,
  toPercentage,
  getProficiencyScore,
  getClarityScore,
  getCreativityScore,
  getComplexityScore,
  getObjectiveScore
} from '../constants/scoring';

export interface ScoreResult {
  framework: Framework;
  score: number;
  confidence: number;
}

export interface RecommendationResult {
  topScore: number;
  bestFramework: Framework | null;
  confidence: number;
  isUserNew: boolean;
  hasHighScorers: boolean;
  alternatives: Framework[];
}

export interface ScoreContext {
  complexity: number;
  specificity: number;
  creativity: number;
  experience: number;
  objectiveNature: number;
  completeness: number;
}

/**
 * Simple answers object for scoring calculations
 */
export interface Answers {
  problem_type: string;
  clarity: string;
  creativity: string;
  experience: string;
  output_type: string;
  [key: string]: string;
}

/**
 * Calculates individual framework scores based on user answers
 */
export function calculateFrameworkScores(frameworks: Framework[], answers: Answers): ScoreResult[] {
  return frameworks.map(framework => {
    const score = calculateSingleFrameworkScore(framework, answers);
    const confidence = calculateScoreConfidence(score, answers);
    
    return {
      framework,
      score,
      confidence
    };
  });
}

/**
 * Calculates score for a single framework based on user answers
 */
function calculateSingleFrameworkScore(framework: Framework, answers: Answers): number {
  let score = 0;
  
  // Base scoring logic for each framework type
  switch (framework.id) {
    case 'tot':
      score = calculateTreeOfThoughtScore(answers);
      break;
    case 'cot':
      score = calculateChainOfThoughtScore(answers);
      break;
    case 'self-consistency':
      score = calculateSelfConsistencyScore(answers);
      break;
    case 'role':
      score = calculateRolePromptingScore(answers);
      break;
    case 'reflection':
      score = calculateReflectionScore(answers);
      break;
  }
  
  return Math.round(score);
}

/**
 * Calculates confidence level for a framework score
 */
function calculateScoreConfidence(score: number, answers: Answers): number {
  const context = buildScoreContext(answers);
  
  // Higher confidence for extreme scores
  const scoreConfidence = Math.abs(score - SCORE_BOUNDS.BASE) / SCORE_BOUNDS.BASE;
  
  // Higher confidence when user provides more complete answers
  const completenessConfidence = context.completeness;
  
  // Lower confidence for new users
  const experienceConfidence = context.experience;
  
  return toPercentage((scoreConfidence + completenessConfidence + experienceConfidence) / 3);
}

/**
 * Builds scoring context from user answers
 */
function buildScoreContext(answers: Answers): ScoreContext {
  const complexity = getComplexityScore(answers.problem_type);
  const specificity = getClarityScore(answers.clarity);
  const creativity = getCreativityScore(answers.creativity);
  const experience = getProficiencyScore(answers.experience);
  const objectiveNature = getObjectiveScore(answers.output_type);
  const completeness = calculateCompletenessScore(answers);
  
  return {
    complexity,
    specificity,
    creativity,
    experience,
    objectiveNature,
    completeness
  };
}

/**
 * Calculates completeness score based on how many fields are filled
 */
function calculateCompletenessScore(answers: Answers): number {
  const fields = [
    answers.problem_type,
    answers.clarity,
    answers.creativity,
    answers.experience,
    answers.output_type
  ];
  
  const completed = fields.filter(field => field && field !== '').length;
  return completed / fields.length;
}

/**
 * Tree-of-Thought scoring logic
 */
function calculateTreeOfThoughtScore(answers: Answers): number {
  const context = buildScoreContext(answers);
  let score = SCORE_BOUNDS.BASE;
  
  // Higher for complex problems
  if (context.complexity >= 0.7) score += SCORING_ADJUSTMENTS.CRITICAL;
  else if (context.complexity >= 0.4) score += SCORING_ADJUSTMENTS.MODERATE;
  
  // Lower for creative tasks
  if (context.creativity >= 0.8) score -= SCORING_ADJUSTMENTS.SIGNIFICANT;
  else if (context.creativity >= 0.6) score -= SCORING_ADJUSTMENTS.MODERATE;
  
  // Higher for objective outputs
  if (context.objectiveNature >= 0.7) score += SCORING_ADJUSTMENTS.SIGNIFICANT;
  
  // Adjust for experience
  if (context.experience >= 0.8) score += SCORING_ADJUSTMENTS.MODERATE;
  else if (context.experience <= 0.3) score -= SCORING_ADJUSTMENTS.MINOR;
  
  return clampScore(score);
}

/**
 * Chain-of-Thought scoring logic
 */
function calculateChainOfThoughtScore(answers: Answers): number {
  const context = buildScoreContext(answers);
  let score = SCORE_BOUNDS.BASE + SCORING_ADJUSTMENTS.MODERATE; // Slightly higher base (good general-purpose framework)
  
  // Great for logical problems
  if (answers.problem_type === 'analytical' || answers.problem_type === 'decision') {
    score += SCORING_ADJUSTMENTS.MAJOR;
  }
  
  // Good for clear, specific problems
  if (context.specificity >= 0.7) score += SCORING_ADJUSTMENTS.SIGNIFICANT;
  
  // Less ideal for highly creative tasks
  if (context.creativity >= 0.8) score -= SCORING_ADJUSTMENTS.MODERATE;
  
  // Excellent for beginners
  if (context.experience <= 0.4) score += SCORING_ADJUSTMENTS.SIGNIFICANT;
  
  return clampScore(score);
}

/**
 * Self-Consistency scoring logic
 */
function calculateSelfConsistencyScore(answers: Answers): number {
  const context = buildScoreContext(answers);
  let score = SCORE_BOUNDS.BASE - SCORING_ADJUSTMENTS.MINOR; // Lower base score (more specialized)
  
  // Excellent for uncertain/ambiguous problems
  if (answers.clarity === 'unclear' || answers.clarity === 'somewhat-clear') {
    score += SCORING_ADJUSTMENTS.CRITICAL;
  }
  
  // Good for high-stakes decisions
  if (answers.problem_type === 'decision') score += SCORING_ADJUSTMENTS.MAJOR;
  
  // Higher for complex problems
  if (context.complexity >= 0.7) score += SCORING_ADJUSTMENTS.SIGNIFICANT;
  
  // Better for experienced users
  if (context.experience >= 0.6) score += SCORING_ADJUSTMENTS.MODERATE;
  
  return clampScore(score);
}

/**
 * Role Prompting scoring logic
 */
function calculateRolePromptingScore(answers: Answers): number {
  const context = buildScoreContext(answers);
  let score = SCORE_BOUNDS.BASE + SCORING_ADJUSTMENTS.MINOR; // Good general-purpose score
  
  // Excellent for creative tasks
  if (context.creativity >= 0.7) score += SCORING_ADJUSTMENTS.MAJOR;
  
  // Great for content creation
  if (answers.output_type === 'creative' || answers.output_type === 'content') {
    score += SCORING_ADJUSTMENTS.MAJOR - 2;
  }
  
  // Good for beginners
  if (context.experience <= 0.5) score += SCORING_ADJUSTMENTS.MODERATE + 2;
  
  // Less ideal for purely analytical tasks
  if (answers.problem_type === 'analytical') score -= SCORING_ADJUSTMENTS.MODERATE - 2;
  
  return clampScore(score);
}

/**
 * Reflection scoring logic
 */
function calculateReflectionScore(answers: Answers): number {
  const context = buildScoreContext(answers);
  let score = SCORE_BOUNDS.BASE;
  
  // Excellent for creative and content tasks
  if (context.creativity >= 0.6) score += SCORING_ADJUSTMENTS.MAJOR;
  
  // Great when quality is important
  if (answers.output_type === 'creative' || answers.output_type === 'content') {
    score += SCORING_ADJUSTMENTS.SIGNIFICANT;
  }
  
  // Good for complex problems requiring iteration
  if (context.complexity >= 0.6) score += SCORING_ADJUSTMENTS.MODERATE + 2;
  
  // Better for experienced users who can provide good criteria
  if (context.experience >= 0.7) score += SCORING_ADJUSTMENTS.MODERATE - 2;
  
  return clampScore(score);
}

/**
 * Determines the final recommendation based on calculated scores
 */
export function determineRecommendation(scoreResults: ScoreResult[], answers: Answers): RecommendationResult {
  // Sort by score descending
  const sortedResults = scoreResults.sort((a, b) => b.score - a.score);
  
  const topScore = sortedResults[0]?.score || 0;
  const bestFramework = sortedResults[0]?.framework || null;
  const confidence = sortedResults[0]?.confidence || 0;
  
  // Check if user is new to prompting
  const isUserNew = answers.experience === 'beginner';
  
  // Check if there are multiple high-scoring frameworks (within 10 points)
  const hasHighScorers = sortedResults.filter(result => result.score >= topScore - SCORING_ADJUSTMENTS.MODERATE).length > 1;
  
  // Get alternative recommendations (next 2-3 highest scoring, different from top)
  const alternatives = sortedResults
    .slice(1, 4)
    .filter(result => result.score >= 30) // Only include reasonable alternatives
    .map(result => result.framework);
  
  return {
    topScore,
    bestFramework,
    confidence,
    isUserNew,
    hasHighScorers,
    alternatives
  };
}