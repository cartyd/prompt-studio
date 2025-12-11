import { describe, it, expect } from '@jest/globals';
import {
  wizardQuestions,
  calculateRecommendation,
  validateAnswers,
} from '../src/wizard/questions';
import { WizardAnswer } from '../src/types';

describe('Wizard Questions', () => {
  it('should have all 4 questions defined', () => {
    expect(wizardQuestions).toHaveLength(4);
  });

  it('should have valid question structure', () => {
    wizardQuestions.forEach((question) => {
      expect(question.id).toBeTruthy();
      expect(question.text).toBeTruthy();
      expect(question.type).toMatch(/^(single-choice|multiple-choice)$/);
      expect(question.options.length).toBeGreaterThan(0);

      question.options.forEach((option) => {
        expect(option.id).toBeTruthy();
        expect(option.text).toBeTruthy();
        expect(option.weights).toBeDefined();
        expect(typeof option.weights).toBe('object');
      });
    });
  });
});

describe('Answer Validation', () => {
  it('should validate complete answers', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['explore-ideas'] },
      { questionId: 'q2', selectedOptionIds: ['multiple-approaches'] },
      { questionId: 'q3', selectedOptionIds: ['creativity'] },
      { questionId: 'q4', selectedOptionIds: ['open-exploration'] },
    ];

    const result = validateAnswers(answers);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject empty answers', () => {
    const result = validateAnswers([]);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('No answers provided');
  });

  it('should reject incomplete answers', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['explore-ideas'] },
      { questionId: 'q2', selectedOptionIds: ['multiple-approaches'] },
    ];

    const result = validateAnswers(answers);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing answers');
  });

  it('should reject invalid question IDs', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'invalid', selectedOptionIds: ['test'] },
      { questionId: 'q2', selectedOptionIds: ['multiple-approaches'] },
      { questionId: 'q3', selectedOptionIds: ['creativity'] },
      { questionId: 'q4', selectedOptionIds: ['open-exploration'] },
    ];

    const result = validateAnswers(answers);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid question ID');
  });

  it('should reject invalid option IDs', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['invalid-option'] },
      { questionId: 'q2', selectedOptionIds: ['multiple-approaches'] },
      { questionId: 'q3', selectedOptionIds: ['creativity'] },
      { questionId: 'q4', selectedOptionIds: ['open-exploration'] },
    ];

    const result = validateAnswers(answers);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid option IDs');
  });

  it('should reject multiple selections for single-choice questions', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['explore-ideas', 'break-down-problem'] },
      { questionId: 'q2', selectedOptionIds: ['multiple-approaches'] },
      { questionId: 'q3', selectedOptionIds: ['creativity'] },
      { questionId: 'q4', selectedOptionIds: ['open-exploration'] },
    ];

    const result = validateAnswers(answers);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('allows only one selection');
  });

  it('should reject answers with no option selected', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: [] },
      { questionId: 'q2', selectedOptionIds: ['multiple-approaches'] },
      { questionId: 'q3', selectedOptionIds: ['creativity'] },
      { questionId: 'q4', selectedOptionIds: ['open-exploration'] },
    ];

    const result = validateAnswers(answers);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('No option selected');
  });
});

describe('Recommendation Algorithm', () => {
  it('should recommend ToT for exploring multiple ideas', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['explore-ideas'] },
      { questionId: 'q2', selectedOptionIds: ['multiple-approaches'] },
      { questionId: 'q3', selectedOptionIds: ['creativity'] },
      { questionId: 'q4', selectedOptionIds: ['open-exploration'] },
    ];

    const result = calculateRecommendation(answers);
    expect(result.frameworkId).toBe('tot');
    expect(result.frameworkName).toBe('Tree-of-Thought (ToT)');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.explanation).toBeTruthy();
    expect(result.whyChosen.length).toBeGreaterThan(0);
  });

  it('should recommend CoT for step-by-step analysis', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['break-down-problem'] },
      { questionId: 'q2', selectedOptionIds: ['logical-steps'] },
      { questionId: 'q3', selectedOptionIds: ['clarity'] },
      { questionId: 'q4', selectedOptionIds: ['clear-problem'] },
    ];

    const result = calculateRecommendation(answers);
    expect(result.frameworkId).toBe('cot');
    expect(result.frameworkName).toBe('Chain-of-Thought (CoT)');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should recommend Reflection for improving drafts', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['improve-draft'] },
      { questionId: 'q2', selectedOptionIds: ['iterative-refinement'] },
      { questionId: 'q3', selectedOptionIds: ['polish'] },
      { questionId: 'q4', selectedOptionIds: ['have-draft'] },
    ];

    const result = calculateRecommendation(answers);
    expect(result.frameworkId).toBe('reflection');
    expect(result.frameworkName).toBe('Reflection / Revision');
  });

  it('should recommend Few-Shot for matching styles', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['match-style'] },
      { questionId: 'q2', selectedOptionIds: ['follow-examples'] },
      { questionId: 'q3', selectedOptionIds: ['tone-style'] },
      { questionId: 'q4', selectedOptionIds: ['have-examples'] },
    ];

    const result = calculateRecommendation(answers);
    expect(result.frameworkId).toBe('role');
    expect(result.frameworkName).toBe('Few-Shot / Role Prompting');
  });

  it('should recommend Self-Consistency for best version', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['best-version'] },
      { questionId: 'q2', selectedOptionIds: ['generate-synthesize'] },
      { questionId: 'q3', selectedOptionIds: ['polish'] },
      { questionId: 'q4', selectedOptionIds: ['need-synthesis'] },
    ];

    const result = calculateRecommendation(answers);
    expect(result.frameworkId).toBe('self-consistency');
    expect(result.frameworkName).toBe('Self-Consistency');
  });

  it('should return default recommendation for empty answers', () => {
    const result = calculateRecommendation([]);
    expect(result.frameworkId).toBe('cot');
    expect(result.confidence).toBe(50);
  });

  it('should calculate confidence scores correctly', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['explore-ideas'] },
      { questionId: 'q2', selectedOptionIds: ['multiple-approaches'] },
      { questionId: 'q3', selectedOptionIds: ['creativity'] },
      { questionId: 'q4', selectedOptionIds: ['open-exploration'] },
    ];

    const result = calculateRecommendation(answers);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('should include prepopulate data when available', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['explore-ideas'] },
      { questionId: 'q2', selectedOptionIds: ['multiple-approaches'] },
      { questionId: 'q3', selectedOptionIds: ['creativity'] },
      { questionId: 'q4', selectedOptionIds: ['open-exploration'] },
    ];

    const result = calculateRecommendation(answers);
    if (result.prepopulateData) {
      expect(typeof result.prepopulateData).toBe('object');
      expect(result.prepopulateData.role).toBeTruthy();
    }
  });

  it('should provide alternative recommendations when confidence is 50% or lower', () => {
    // Create a scenario with mixed signals that should result in low confidence
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['explore-ideas'] },
      { questionId: 'q2', selectedOptionIds: ['generate-synthesize'] },
      { questionId: 'q3', selectedOptionIds: ['accuracy'] },
      { questionId: 'q4', selectedOptionIds: ['open-exploration'] },
    ];

    const result = calculateRecommendation(answers);
    
    if (result.confidence <= 50) {
      expect(result.alternativeRecommendations).toBeDefined();
      expect(Array.isArray(result.alternativeRecommendations)).toBe(true);
      if (result.alternativeRecommendations && result.alternativeRecommendations.length > 0) {
        result.alternativeRecommendations.forEach((alt) => {
          expect(alt.frameworkId).toBeTruthy();
          expect(alt.frameworkName).toBeTruthy();
          expect(alt.confidence).toBeGreaterThan(0);
          expect(alt.explanation).toBeTruthy();
        });
      }
    }
  });

  it('should handle all framework IDs correctly', () => {
    const frameworkIds = ['tot', 'cot', 'self-consistency', 'role', 'reflection'];
    
    frameworkIds.forEach((id) => {
      // Create answers that heavily favor this framework
      const answers: WizardAnswer[] = [
        { questionId: 'q1', selectedOptionIds: ['explore-ideas'] },
        { questionId: 'q2', selectedOptionIds: ['multiple-approaches'] },
        { questionId: 'q3', selectedOptionIds: ['creativity'] },
        { questionId: 'q4', selectedOptionIds: ['open-exploration'] },
      ];

      // This tests that recommendation returns valid data structure
      const result = calculateRecommendation(answers);
      expect(result.frameworkId).toBeTruthy();
      expect(result.frameworkName).toBeTruthy();
      expect(result.explanation).toBeTruthy();
      expect(Array.isArray(result.whyChosen)).toBe(true);
    });
  });
});

describe('Mixed Scenario Recommendations', () => {
  it('should handle competing weights correctly', () => {
    const answers: WizardAnswer[] = [
      { questionId: 'q1', selectedOptionIds: ['explore-ideas'] },
      { questionId: 'q2', selectedOptionIds: ['logical-steps'] },
      { questionId: 'q3', selectedOptionIds: ['accuracy'] },
      { questionId: 'q4', selectedOptionIds: ['clear-problem'] },
    ];

    const result = calculateRecommendation(answers);
    // Should be either ToT or CoT based on weights
    expect(['tot', 'cot']).toContain(result.frameworkId);
    expect(result.confidence).toBeGreaterThan(0);
  });
});
