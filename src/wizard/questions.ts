import { WizardQuestion, WizardAnswer, WizardRecommendation } from '../types/index';
import { 
  CONFIDENCE_THRESHOLDS, 
  toPercentage,
  DEFAULT_FRAMEWORK_ROLES,
  FRAMEWORK_IDS
} from '../constants/scoring';
import { 
  getFrameworkName, 
  getFrameworkExplanation, 
  getFrameworkSelectionReasons, 
  generatePrepopulateData 
} from './data-mapping';

/**
 * Wizard questions designed to guide non-technical users to the right framework
 * Based on frameworks-selection.md guidance
 */
export const wizardQuestions: WizardQuestion[] = [
  {
    id: 'q1',
    text: 'What do you want to accomplish?',
    description: 'Choose the option that best describes your goal',
    type: 'single-choice',
    options: [
      {
        id: 'explore-ideas',
        text: 'Explore different ideas before deciding',
        description: 'I want to brainstorm multiple approaches and choose the best one',
        icon: 'bx-network-chart',
        weights: { tot: 5, cot: 1, 'self-consistency': 1 },
      },
      {
        id: 'break-down-problem',
        text: 'Break down a complex problem step-by-step',
        description: 'I need logical reasoning and clear structure',
        icon: 'bx-link',
        weights: { cot: 5, tot: 1 },
      },
      {
        id: 'improve-draft',
        text: 'Improve something I already have',
        description: 'I have a draft and want to make it better',
        icon: 'bx-edit',
        weights: { reflection: 5 },
      },
      {
        id: 'match-style',
        text: 'Create something that matches a specific style',
        description: 'I have examples and want consistent output',
        icon: 'bx-copy',
        weights: { role: 5 },
      },
      {
        id: 'best-version',
        text: 'Get the best possible answer',
        description: 'I want multiple attempts combined into one great result',
        icon: 'bx-check-circle',
        weights: { 'self-consistency': 5, tot: 1 },
      },
    ],
  },
  {
    id: 'q2',
    text: 'How do you prefer to work?',
    description: 'This helps us match you with the right thinking style',
    type: 'single-choice',
    options: [
      {
        id: 'multiple-approaches',
        text: 'See multiple approaches, then choose the best',
        description: 'I like comparing different options before deciding',
        icon: 'bx-scatter-chart',
        weights: { tot: 5, 'self-consistency': 1 },
      },
      {
        id: 'logical-steps',
        text: 'Follow a logical, step-by-step process',
        description: 'I prefer structured reasoning from start to finish',
        icon: 'bx-list-ol',
        weights: { cot: 5 },
      },
      {
        id: 'iterative-refinement',
        text: 'Start rough, then refine iteratively',
        description: 'I like to draft first, then improve through feedback',
        icon: 'bx-paint',
        weights: { reflection: 5, 'self-consistency': 1 },
      },
      {
        id: 'follow-examples',
        text: 'Follow patterns and examples',
        description: 'I work best when I can replicate a proven approach',
        icon: 'bx-copy',
        weights: { role: 5 },
      },
      {
        id: 'generate-synthesize',
        text: 'Generate several ideas, then synthesize the best parts',
        description: 'I like creating multiple versions and combining strengths',
        icon: 'bx-target-lock',
        weights: { 'self-consistency': 5, tot: 1 },
      },
    ],
  },
  {
    id: 'q3',
    text: 'What matters most to you?',
    description: 'Select what\'s most important for your result',
    type: 'single-choice',
    options: [
      {
        id: 'accuracy',
        text: 'Accuracy and thoroughness',
        description: 'Getting the right answer is critical',
        icon: 'bx-bullseye',
        weights: { cot: 4, tot: 2, 'self-consistency': 1 },
      },
      {
        id: 'creativity',
        text: 'Exploring creative alternatives',
        description: 'Want to see different possibilities',
        icon: 'bx-bulb',
        weights: { tot: 5, 'self-consistency': 1 },
      },
      {
        id: 'tone-style',
        text: 'Tone and style consistency',
        description: 'How it sounds matters as much as what it says',
        icon: 'bx-palette',
        weights: { role: 5, 'self-consistency': 1 },
      },
      {
        id: 'clarity',
        text: 'Clarity and easy-to-follow reasoning',
        description: 'I need to understand the thinking process',
        icon: 'bx-book-open',
        weights: { cot: 5, reflection: 1 },
      },
      {
        id: 'polish',
        text: 'A polished, refined final result',
        description: 'Quality and completeness above all',
        icon: 'bx-medal',
        weights: { reflection: 4, 'self-consistency': 3 },
      },
    ],
  },
  {
    id: 'q4',
    text: 'What starting point do you have?',
    description: 'This helps us tailor the framework to your situation',
    type: 'single-choice',
    options: [
      {
        id: 'have-examples',
        text: 'Specific examples of desired output',
        description: 'I have samples that show what I want',
        icon: 'bx-collection',
        weights: { role: 5 },
      },
      {
        id: 'have-draft',
        text: 'A draft that needs improvement',
        description: 'I\'ve already created something that needs refinement',
        icon: 'bx-file',
        weights: { reflection: 4, 'self-consistency': 1 },
      },
      {
        id: 'clear-problem',
        text: 'A clear problem definition',
        description: 'I know exactly what needs to be solved',
        icon: 'bx-bullseye',
        weights: { cot: 4, tot: 1 },
      },
      {
        id: 'open-exploration',
        text: 'Open-ended exploration needed',
        description: 'I\'m still figuring out the best approach',
        icon: 'bx-compass',
        weights: { tot: 4, 'self-consistency': 1 },
      },
      {
        id: 'need-synthesis',
        text: 'Need highest quality synthesis',
        description: 'I want the best possible result from multiple attempts',
        icon: 'bx-diamond',
        weights: { 'self-consistency': 4, reflection: 1 },
      },
    ],
  },
];

/**
 * Calculate framework recommendation based on user answers
 */
export function calculateRecommendation(answers: WizardAnswer[]): WizardRecommendation {
  const scores: Record<string, number> = {
    tot: 0,
    cot: 0,
    'self-consistency': 0,
    role: 0,
    reflection: 0,
  };

  // Calculate weighted scores
  answers.forEach((answer) => {
    const question = wizardQuestions.find((q) => q.id === answer.questionId);
    if (!question) return;

    answer.selectedOptionIds.forEach((optionId) => {
      const option = question.options.find((o) => o.id === optionId);
      if (!option) return;

      Object.entries(option.weights).forEach(([framework, weight]) => {
        scores[framework] = (scores[framework] || 0) + (weight || 0);
      });
    });
  });

  // Find framework with highest score
  const sortedFrameworks = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0);

  if (sortedFrameworks.length === 0) {
    // Default to CoT if no clear winner
    return {
      frameworkId: FRAMEWORK_IDS.CHAIN_OF_THOUGHT,
      frameworkName: 'Chain-of-Thought (CoT)',
      confidence: CONFIDENCE_THRESHOLDS.LOW,
      explanation:
        'Chain-of-Thought helps you break down any problem into clear, logical steps. It\'s a great all-purpose approach for structured thinking.',
      whyChosen: [
        'Versatile framework that works well for many types of tasks',
        'Provides clear reasoning you can follow',
      ],
    };
  }

  const [topFramework, topScore] = sortedFrameworks[0];
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  const confidence = toPercentage(topScore / totalScore);

  const recommendation: WizardRecommendation = {
    frameworkId: topFramework,
    frameworkName: getFrameworkName(topFramework),
    confidence,
    explanation: getFrameworkExplanation(topFramework),
    whyChosen: getWhyChosenReasons(topFramework, answers),
    prepopulateData: getPrepopulateData(topFramework, answers),
  };

  // If confidence is 50% or lower, include alternative recommendations
  if (confidence <= CONFIDENCE_THRESHOLDS.ALTERNATIVE_CUTOFF && sortedFrameworks.length > 1) {
    const alternatives = sortedFrameworks
      .slice(1, 3) // Get top 2 alternatives
      .map(([frameworkId, score]) => ({
        frameworkId,
        frameworkName: getFrameworkName(frameworkId),
        confidence: toPercentage(score / totalScore),
        explanation: getFrameworkExplanation(frameworkId),
      }));

    recommendation.alternativeRecommendations = alternatives;
  }

  return recommendation;
}

function getWhyChosenReasons(frameworkId: string, _answers: WizardAnswer[]): string[] {
  // Convert answers to simple object format expected by data-mapping functions
  const answersObj = _answers.reduce((acc, answer) => {
    acc[answer.questionId] = answer.selectedOptionIds[0] || '';
    return acc;
  }, {} as Record<string, string>);

  return getFrameworkSelectionReasons(frameworkId, answersObj);
}

function getPrepopulateData(
  frameworkId: string,
  answers: WizardAnswer[]
): Record<string, string> | undefined {
  // Convert answers to simple object format expected by data-mapping functions
  const answersObj = answers.reduce((acc, answer) => {
    acc[answer.questionId] = answer.selectedOptionIds[0] || '';
    return acc;
  }, {} as Record<string, string>);

  const data = generatePrepopulateData(frameworkId, answersObj);
  
  // Convert any string[] values to comma-separated strings for form compatibility
  const convertedData: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    convertedData[key] = Array.isArray(value) ? value.join(', ') : value;
  }
  
  return Object.keys(convertedData).length > 0 ? convertedData : getDefaultPrepopulateData(frameworkId, answers);
}

function getDefaultPrepopulateData(
  frameworkId: string,
  answers: WizardAnswer[]
): Record<string, string> | undefined {
  // Extract user intent from answers to prepopulate form
  const q1Answer = answers.find((a) => a.questionId === 'q1');
  const prepopulate: Record<string, string> = {};

  // Set default role based on framework
  if (DEFAULT_FRAMEWORK_ROLES[frameworkId as keyof typeof DEFAULT_FRAMEWORK_ROLES]) {
    prepopulate.role = DEFAULT_FRAMEWORK_ROLES[frameworkId as keyof typeof DEFAULT_FRAMEWORK_ROLES];
  }

  // Provide helpful placeholder based on user's goal
  if (q1Answer?.selectedOptionIds[0] === 'explore-ideas' && frameworkId === FRAMEWORK_IDS.TREE_OF_THOUGHT) {
    prepopulate.objective =
      'Describe the decision or problem you need to solve. Include any relevant constraints, goals, or context.';
  } else if (q1Answer?.selectedOptionIds[0] === 'break-down-problem' && frameworkId === FRAMEWORK_IDS.CHAIN_OF_THOUGHT) {
    prepopulate.problem =
      'Describe the problem you need to solve step-by-step. Include any relevant data or context.';
  } else if (q1Answer?.selectedOptionIds[0] === 'improve-draft' && frameworkId === FRAMEWORK_IDS.REFLECTION) {
    prepopulate.task = 'Describe what you want to create or improve.';
    prepopulate.criteria =
      'What should be improved? (e.g., clarity, tone, completeness, accuracy)';
  }

  return Object.keys(prepopulate).length > 0 ? prepopulate : undefined;
}

/**
 * Validate wizard answers
 */
export function validateAnswers(answers: WizardAnswer[]): { valid: boolean; error?: string } {
  if (!answers || answers.length === 0) {
    return { valid: false, error: 'No answers provided' };
  }

  // Check that all questions are answered
  const answeredQuestionIds = new Set(answers.map((a) => a.questionId));
  const requiredQuestionIds = wizardQuestions.map((q) => q.id);

  const missingQuestions = requiredQuestionIds.filter((id) => !answeredQuestionIds.has(id));
  if (missingQuestions.length > 0) {
    return { valid: false, error: `Missing answers for questions: ${missingQuestions.join(', ')}` };
  }

  // Validate each answer
  for (const answer of answers) {
    const question = wizardQuestions.find((q) => q.id === answer.questionId);
    if (!question) {
      return { valid: false, error: `Invalid question ID: ${answer.questionId}` };
    }

    if (!answer.selectedOptionIds || answer.selectedOptionIds.length === 0) {
      return { valid: false, error: `No option selected for question: ${answer.questionId}` };
    }

    // Validate selected options exist
    const validOptionIds = question.options.map((o) => o.id);
    const invalidOptions = answer.selectedOptionIds.filter((id) => !validOptionIds.includes(id));
    if (invalidOptions.length > 0) {
      return {
        valid: false,
        error: `Invalid option IDs for question ${answer.questionId}: ${invalidOptions.join(', ')}`,
      };
    }

    // Validate single vs multiple choice
    if (question.type === 'single-choice' && answer.selectedOptionIds.length > 1) {
      return { valid: false, error: `Question ${answer.questionId} allows only one selection` };
    }
  }

  return { valid: true };
}
