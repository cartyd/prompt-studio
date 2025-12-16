import { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../plugins/auth';
import { frameworks, getFrameworkById, generatePrompt } from '../frameworks';
import { ERROR_MESSAGES } from '../constants';
import { logEvent } from '../utils/analytics';
import { LIMITS } from '../constants/scoring';
import { FrameworkFormHelpers } from '../utils/framework-form-helpers';

const frameworkRoutes: FastifyPluginAsync = async (fastify) => {
  // List all frameworks
  fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
    return reply.viewWithCsrf('frameworks/list', {
      frameworks,
      user: request.user,
      subscription: request.subscription,
    });
  });

  // Show framework form
  fastify.get('/:frameworkId', { preHandler: requireAuth }, async (request, reply) => {
    const { frameworkId } = request.params as { frameworkId: string };
    const { fromWizard, prepopulate } = request.query as { fromWizard?: string; prepopulate?: string };
    const framework = getFrameworkById(frameworkId);

    if (!framework) {
      return reply.status(404).viewWithCsrf('error', {
        message: ERROR_MESSAGES.FRAMEWORKS.NOT_FOUND,
        user: request.user,
      });
    }

    // Fetch custom criteria for premium users
    let customCriteria: string[] = [];
    if (request.subscription?.isPremium) {
      const criteria = await fastify.prisma.customCriteria.findMany({
        where: { userId: request.user!.id },
        orderBy: { createdAt: 'desc' },
      });
      customCriteria = criteria.map((c: { criteriaName: string }) => c.criteriaName);
    }

    // Parse prepopulate data from wizard if provided
    let prepopulateData: Record<string, string> | undefined;
    if (prepopulate) {
      try {
        prepopulateData = JSON.parse(decodeURIComponent(prepopulate));
      } catch (e) {
        // Invalid JSON, ignore
        prepopulateData = undefined;
      }
    }

    // Log framework view event
    await logEvent(fastify.prisma, request, request.user?.id, 'framework_view', {
      frameworkId,
      frameworkName: framework.name,
      fromWizard: fromWizard === 'true',
    });
    
    // Render form components server-side
    const renderedExamples = FrameworkFormHelpers.renderExamplesSection(framework as any);
    const renderedFields = FrameworkFormHelpers.renderFormFields(framework as any, prepopulateData || {}, fromWizard === 'true');
    const renderedCriteria = FrameworkFormHelpers.renderCriteriaSelector(framework as any, request.subscription!);
    const renderedAdvanced = FrameworkFormHelpers.renderAdvancedOptions(framework as any);
    const renderedTemplates = FrameworkFormHelpers.renderTemplatesSection(framework as any);
    const renderedModal = FrameworkFormHelpers.renderModal();

    return reply.viewWithCsrf('frameworks/form', {
      framework,
      user: request.user,
      subscription: request.subscription,
      customCriteria,
      prepopulateData,
      fromWizard: fromWizard === 'true',
      renderedExamples,
      renderedFields,
      renderedCriteria,
      renderedAdvanced,
      renderedTemplates,
      renderedModal,
    });
  });

  // Generate prompt preview (htmx endpoint)
  fastify.post('/:frameworkId/generate', { preHandler: requireAuth }, async (request, reply) => {
    const { frameworkId } = request.params as { frameworkId: string };
    const framework = getFrameworkById(frameworkId);

    if (!framework) {
      return reply.status(404).send('<div class="error">Framework not found</div>');
    }

    const formData = request.body as Record<string, string | string[]>;
    
    // Validate version/approach limits (max 5 for all users)
    const maxLimit = LIMITS.MAX_FRAMEWORK_APPROACHES;
    if (formData.approaches) {
      const approaches = parseInt(formData.approaches as string, 10);
      if (approaches > maxLimit) {
        return reply.status(400).send(`<div class="error">Number of approaches cannot exceed ${maxLimit}</div>`);
      }
    }
    if (formData.versions) {
      const versions = parseInt(formData.versions as string, 10);
      if (versions > maxLimit) {
        return reply.status(400).send(`<div class="error">Number of versions cannot exceed ${maxLimit}</div>`);
      }
    }
    
    try {
      const promptText = generatePrompt(frameworkId, formData);
      
      // Log prompt generation event
      await logEvent(fastify.prisma, request, request.user?.id, 'prompt_generate', {
        frameworkId,
        frameworkType: framework.name,
      });
      
      return reply.view('partials/prompt-preview', {
        promptText,
        frameworkId,
        frameworkName: framework.name,
        formData,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate prompt';
      return reply.status(400).send(`<div class="error">${errorMessage}</div>`);
    }
  });
};

export default frameworkRoutes;
