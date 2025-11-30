import { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../plugins/auth';
import { frameworks, getFrameworkById, generatePrompt } from '../frameworks';
import { ERROR_MESSAGES } from '../constants';

const frameworkRoutes: FastifyPluginAsync = async (fastify) => {
  // List all frameworks
  fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
    return reply.view('frameworks/list', {
      frameworks,
      user: request.user,
      subscription: request.subscription,
    });
  });

  // Show framework form
  fastify.get('/:frameworkId', { preHandler: requireAuth }, async (request, reply) => {
    const { frameworkId } = request.params as { frameworkId: string };
    const framework = getFrameworkById(frameworkId);

    if (!framework) {
      return reply.status(404).view('error', {
        message: ERROR_MESSAGES.FRAMEWORKS.NOT_FOUND,
        user: request.user,
      });
    }

    return reply.view('frameworks/form', {
      framework,
      user: request.user,
      subscription: request.subscription,
    });
  });

  // Generate prompt preview (htmx endpoint)
  fastify.post('/:frameworkId/generate', { preHandler: requireAuth }, async (request, reply) => {
    const { frameworkId } = request.params as { frameworkId: string };
    const framework = getFrameworkById(frameworkId);

    if (!framework) {
      return reply.status(404).send('<div class="error">Framework not found</div>');
    }

    const formData = request.body as Record<string, string>;
    
    try {
      const promptText = generatePrompt(frameworkId, formData);
      
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
