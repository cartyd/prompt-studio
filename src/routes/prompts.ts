import { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../plugins/auth';
import { FREE_PROMPT_LIMIT } from '../types';
import { ERROR_MESSAGES } from '../constants';
import { logEvent } from '../utils/analytics';

const MAX_FILENAME_LENGTH = 255; // Most filesystems support up to 255 characters
const DEFAULT_FILENAME = 'prompt';

function sanitizeFilename(title: string): string {
  // Replace non-alphanumeric characters with underscores
  let sanitized = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  
  // Remove leading/trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, '');
  
  // Replace multiple consecutive underscores with a single one
  sanitized = sanitized.replace(/_+/g, '_');
  
  // If empty after sanitization, use default
  if (sanitized.length === 0) {
    sanitized = DEFAULT_FILENAME;
  }
  
  // Truncate if too long (reserve space for extension)
  const maxBaseLength = MAX_FILENAME_LENGTH - 4; // -4 for ".txt"
  if (sanitized.length > maxBaseLength) {
    sanitized = sanitized.substring(0, maxBaseLength);
    // Remove trailing underscore if truncation created one
    sanitized = sanitized.replace(/_+$/, '');
  }
  
  return sanitized;
}

const promptRoutes: FastifyPluginAsync = async (fastify) => {
  // List user's prompts
  fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const prompts = await fastify.prisma.prompt.findMany({
      where: { userId: request.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    return reply.viewWithCsrf('prompts/list', {
      prompts,
      user: request.user,
      subscription: request.subscription,
    });
  });

  // View single prompt
  fastify.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const prompt = await fastify.prisma.prompt.findFirst({
      where: {
        id,
        userId: request.user!.id,
      },
    });

    if (!prompt) {
      return reply.status(404).viewWithCsrf('error', {
        message: ERROR_MESSAGES.PROMPTS.NOT_FOUND,
        user: request.user,
      });
    }

    return reply.viewWithCsrf('prompts/detail', {
      prompt,
      user: request.user,
      subscription: request.subscription,
    });
  });

  // Save new prompt (htmx endpoint)
  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const { frameworkId, frameworkName, promptText, title } = request.body as {
      frameworkId: string;
      frameworkName: string;
      promptText: string;
      title?: string;
    };

    // Check free tier limit
    if (!request.subscription!.isPremium) {
      const promptCount = await fastify.prisma.prompt.count({
        where: { userId: request.user!.id },
      });

      if (promptCount >= USER_CONSTANTS.FREE_TIER_PROMPT_LIMIT) {
        return reply.view('partials/limit-reached', {
          limit: USER_CONSTANTS.FREE_TIER_PROMPT_LIMIT,
        });
      }
    }

    // Create the prompt
    const prompt = await fastify.prisma.prompt.create({
      data: {
        userId: request.user!.id,
        frameworkType: frameworkId,
        title: title || `${frameworkName} Prompt`,
        finalPromptText: promptText,
      },
    });

    // Log prompt save event
    await logEvent(fastify.prisma, request, request.user?.id, 'prompt_save', {
      promptId: prompt.id,
      frameworkType: frameworkId,
      frameworkName,
    });

    return reply.view('partials/prompt-saved', {
      promptId: prompt.id,
    });
  });

  // Delete prompt (htmx endpoint)
  fastify.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const prompt = await fastify.prisma.prompt.findFirst({
      where: {
        id,
        userId: request.user!.id,
      },
    });

    if (!prompt) {
      return reply.status(404).send('<div class="error">Prompt not found</div>');
    }

    await fastify.prisma.prompt.delete({
      where: { id },
    });

    return reply.status(200).send('');
  });

  // Export prompt (premium only)
  fastify.get('/:id/export', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.subscription!.isPremium) {
      return reply.status(403).viewWithCsrf('error', {
        message: ERROR_MESSAGES.PROMPTS.EXPORT_PREMIUM_ONLY,
        user: request.user,
      });
    }

    const { id } = request.params as { id: string };

    const prompt = await fastify.prisma.prompt.findFirst({
      where: {
        id,
        userId: request.user!.id,
      },
    });

    if (!prompt) {
      return reply.status(404).viewWithCsrf('error', {
        message: ERROR_MESSAGES.PROMPTS.NOT_FOUND,
        user: request.user,
      });
    }

    const filename = `${sanitizeFilename(prompt.title)}.txt`;
    const content = `# ${prompt.title}\n\nFramework: ${prompt.frameworkType}\nCreated: ${prompt.createdAt.toISOString()}\n\n---\n\n${prompt.finalPromptText}`;

    return reply
      .header('Content-Type', 'text/plain')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(content);
  });
};

export default promptRoutes;
