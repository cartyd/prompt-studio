import { WizardQuestion, WizardAnswer, WizardRecommendation } from '../types';

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
      frameworkId: 'cot',
      frameworkName: 'Chain-of-Thought (CoT)',
      confidence: 50,
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
  const confidence = Math.round((topScore / totalScore) * 100);

  const recommendation: WizardRecommendation = {
    frameworkId: topFramework,
    frameworkName: getFrameworkName(topFramework),
    confidence,
    explanation: getExplanation(topFramework, answers),
    whyChosen: getWhyChosen(topFramework, answers),
    prepopulateData: getPrepopulateData(topFramework, answers),
  };

  // If confidence is 50% or lower, include alternative recommendations
  if (confidence <= 50 && sortedFrameworks.length > 1) {
    const alternatives = sortedFrameworks
      .slice(1, 3) // Get top 2 alternatives
      .map(([frameworkId, score]) => ({
        frameworkId,
        frameworkName: getFrameworkName(frameworkId),
        confidence: Math.round((score / totalScore) * 100),
        explanation: getExplanation(frameworkId, answers),
      }));

    recommendation.alternativeRecommendations = alternatives;
  }

  return recommendation;
}

function getFrameworkName(id: string): string {
  const names: Record<string, string> = {
    tot: 'Tree-of-Thought (ToT)',
    cot: 'Chain-of-Thought (CoT)',
    'self-consistency': 'Self-Consistency',
    role: 'Few-Shot / Role Prompting',
    reflection: 'Reflection / Revision',
  };
  return names[id] || id;
}

function getExplanation(frameworkId: string, _answers: WizardAnswer[]): string {
  const explanations: Record<string, string> = {
    tot: 'Tree-of-Thought is perfect when you want to explore multiple approaches before deciding. Think of it like brainstorming with yourself. You generate different ideas, evaluate each one, and then choose the best path forward. It\'s especially powerful for complex decisions with many possible outcomes.',
    cot: 'Chain-of-Thought breaks down complex problems into clear, logical steps. Like solving a math problem by showing your work, this framework helps you (and the AI) think through each part of the problem systematically. You get structured reasoning that\'s easy to follow and verify.',
    'self-consistency':
      'Self-Consistency creates multiple versions of your answer and combines the best parts. Imagine having several drafts and picking the strongest elements from each—that\'s what this framework does. It\'s ideal when quality, tone, and polish matter most.',
    role: 'Few-Shot Prompting teaches by example. You show the AI what "good" looks like with 2-3 samples, and it follows that pattern. This is perfect when you need consistency across multiple outputs or want to match a specific style, tone, or format.',
    reflection:
      'Reflection helps you improve what you already have. The AI creates a first draft, critically reviews it for weaknesses, then produces an improved version. It\'s like having an editor who makes your work clearer, more complete, and more polished.',
  };
  return explanations[frameworkId] || '';
}

function getWhyChosen(frameworkId: string, _answers: WizardAnswer[]): string[] {
  const reasons: Record<string, string[]> = {
    tot: [
      'You want to explore multiple approaches before deciding',
      'Your task is complex with many possible outcomes',
      'You value thoroughness and considering alternatives',
    ],
    cot: [
      'You need step-by-step reasoning and clarity',
      'Your task requires careful analysis and planning',
      'Understanding the thinking process is important to you',
    ],
    'self-consistency': [
      'You want the highest quality final result',
      'Tone, wording, and polish are important',
      'Multiple perspectives help create better outcomes',
    ],
    role: [
      'You have examples that show what you want',
      'Consistency and matching a specific style matters',
      'You want predictable, pattern-based results',
    ],
    reflection: [
      'You already have content to improve',
      'Refinement and polish are your priorities',
      'You want critical feedback built into the process',
    ],
  };

  return reasons[frameworkId] || ['This framework matches your needs best'];
}

function getPrepopulateData(
  frameworkId: string,
  answers: WizardAnswer[]
): Record<string, string> | undefined {
  // Extract user intent from answers to prepopulate form
  const q1Answer = answers.find((a) => a.questionId === 'q1');
  const prepopulate: Record<string, string> = {};

  // Set default role based on framework
  const defaultRoles: Record<string, string> = {
    tot: 'expert problem solver',
    cot: 'logical thinker',
    'self-consistency': 'analytical reasoner',
    role: 'professional expert',
    reflection: 'critical editor',
  };

  if (defaultRoles[frameworkId]) {
    prepopulate.role = defaultRoles[frameworkId];
  }

  // Provide helpful placeholder based on user's goal
  if (q1Answer?.selectedOptionIds[0] === 'explore-ideas' && frameworkId === 'tot') {
    prepopulate.objective =
      'Describe the decision or problem you need to solve. Include any relevant constraints, goals, or context.';
  } else if (q1Answer?.selectedOptionIds[0] === 'break-down-problem' && frameworkId === 'cot') {
    prepopulate.problem =
      'Describe the problem you need to solve step-by-step. Include any relevant data or context.';
  } else if (q1Answer?.selectedOptionIds[0] === 'improve-draft' && frameworkId === 'reflection') {
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
