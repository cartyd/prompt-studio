import { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../plugins/auth';
import { wizardQuestions, calculateRecommendation, validateAnswers } from '../wizard/questions';
import { WizardAnswer } from '../types';
import { logEvent } from '../utils/analytics';
import { WizardUtils } from '../utils/wizard-helpers';

const wizardRoutes: FastifyPluginAsync = async (fastify) => {
  // Start wizard - show welcome page
  fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
    // Initialize wizard session
    request.session.wizardSession = {
      answers: [],
      currentStep: 0,
      startedAt: new Date(),
    };

    await logEvent(fastify.prisma, request, request.user?.id, 'framework_view', {
      eventType: 'wizard_start',
      source: 'framework_discovery',
    });

    return reply.viewWithCsrf('wizard/start', {
      user: request.user,
      subscription: request.subscription,
    });
  });

  // Get specific question step
  fastify.get('/question/:step', { preHandler: requireAuth }, async (request, reply) => {
    const { step } = request.params as { step: string };
    const stepNum = parseInt(step, 10);

    if (isNaN(stepNum) || stepNum < 0 || stepNum >= wizardQuestions.length) {
      return reply.status(404).viewWithCsrf('error', {
        message: 'Invalid wizard step',
        user: request.user,
      });
    }

    const question = wizardQuestions[stepNum];
    const session = request.session.wizardSession;

    // Get previous answer if exists
    const previousAnswer = session?.answers.find((a) => a.questionId === question.id);

    // Log wizard step view
    await logEvent(fastify.prisma, request, request.user?.id, 'framework_view', {
      eventType: 'wizard_question_view',
      questionStep: stepNum,
      questionId: question.id,
    });

    // Render wizard question form and script server-side
    const wizardFormHtml = WizardUtils.renderQuestionForm({
      question: question as any,
      stepNum,
      totalSteps: wizardQuestions.length,
      previousAnswer
    });
    const wizardScriptHtml = WizardUtils.renderScript(question as any, wizardQuestions.length, stepNum);
    
    return reply.viewWithCsrf('wizard/question', {
      wizardFormHtml,
      wizardScriptHtml,
      user: request.user,
      subscription: request.subscription,
    });
  });

  // Submit answer for current step
  fastify.post('/answer', { preHandler: requireAuth }, async (request, reply) => {
    const { questionId, selectedOptionIds } = request.body as {
      questionId: string;
      selectedOptionIds: string | string[];
    };

    // Ensure session exists
    if (!request.session.wizardSession) {
      request.session.wizardSession = {
        answers: [],
        currentStep: 0,
        startedAt: new Date(),
      };
    }

    const session = request.session.wizardSession;

    // Validate question exists
    const question = wizardQuestions.find((q) => q.id === questionId);
    if (!question) {
      return reply.status(400).send({ error: 'Invalid question ID' });
    }

    // Normalize selectedOptionIds to array
    const optionIds = Array.isArray(selectedOptionIds) ? selectedOptionIds : [selectedOptionIds];

    // Validate at least one option selected
    if (optionIds.length === 0) {
      return reply.status(400).send({ error: 'Please select at least one option' });
    }

    // Validate single vs multiple choice
    if (question.type === 'single-choice' && optionIds.length > 1) {
      return reply.status(400).send({ error: 'This question allows only one selection' });
    }

    // Create or update answer
    const answerIndex = session.answers.findIndex((a) => a.questionId === questionId);
    const answer: WizardAnswer = {
      questionId,
      selectedOptionIds: optionIds,
    };

    if (answerIndex >= 0) {
      session.answers[answerIndex] = answer;
    } else {
      session.answers.push(answer);
    }

    // Determine next step
    const currentQuestionIndex = wizardQuestions.findIndex((q) => q.id === questionId);
    const nextStep = currentQuestionIndex + 1;

    await logEvent(fastify.prisma, request, request.user?.id, 'framework_view', {
      eventType: 'wizard_answer',
      questionId,
      step: currentQuestionIndex,
    });

    // If this was the last question, redirect to recommendation
    if (nextStep >= wizardQuestions.length) {
      return reply.send({ redirect: '/wizard/recommend' });
    }

    // Otherwise, go to next question
    return reply.send({ redirect: `/wizard/question/${nextStep}` });
  });

  // Get recommendation based on answers
  fastify.get('/recommend', { preHandler: requireAuth }, async (request, reply) => {
    const session = request.session.wizardSession;

    if (!session || !session.answers || session.answers.length === 0) {
      return reply.redirect('/wizard');
    }

    // Validate answers
    const validation = validateAnswers(session.answers);
    if (!validation.valid) {
      // If incomplete, redirect to first unanswered question
      const answeredQuestionIds = new Set(session.answers.map((a) => a.questionId));
      const firstUnanswered = wizardQuestions.findIndex((q) => !answeredQuestionIds.has(q.id));
      return reply.redirect(`/wizard/question/${Math.max(0, firstUnanswered)}`);
    }

    // Calculate recommendation
    const recommendation = calculateRecommendation(session.answers);

    await logEvent(fastify.prisma, request, request.user?.id, 'framework_view', {
      eventType: 'wizard_complete',
      recommendedFramework: recommendation.frameworkId,
      confidence: recommendation.confidence,
      totalAnswers: session.answers.length,
    });

    // Render recommendation page server-side
    const recommendationHtml = WizardUtils.renderRecommendation(recommendation as any, request.csrfToken!);
    
    return reply.viewWithCsrf('wizard/recommendation', {
      recommendationHtml,
      user: request.user,
      subscription: request.subscription,
    });
  });

  // Reset wizard and start over
  fastify.post('/reset', { preHandler: requireAuth }, async (request, reply) => {
    request.session.wizardSession = {
      answers: [],
      currentStep: 0,
      startedAt: new Date(),
    };

    await logEvent(fastify.prisma, request, request.user?.id, 'framework_view', {
      eventType: 'wizard_reset',
    });

    return reply.redirect('/wizard');
  });
};

export default wizardRoutes;
