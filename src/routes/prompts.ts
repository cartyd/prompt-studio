import { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../plugins/auth';
import { ERROR_MESSAGES, USER_CONSTANTS } from '../constants';
import { logEvent } from '../utils/analytics';
import { ViewContextBuilder } from '../utils/view-context';
import { PromptService } from '../services/prompt';
import { FilenameService } from '../services/filename';

const promptRoutes: FastifyPluginAsync = async (fastify) => {
  // List user's prompts
  fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const prompts = await fastify.prisma.prompt.findMany({
      where: { userId: request.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    
    // Process prompts for display using service
    const processedPrompts = PromptService.processForDisplay(
      prompts,
      request.subscription?.isPremium || false
    );

    return reply.viewWithCsrf('prompts/list', ViewContextBuilder.with(request, {
      prompts,
      processedPrompts,
      freeTierLimit: USER_CONSTANTS.FREE_TIER_PROMPT_LIMIT,
    }));
  });

  // View single prompt
  fastify.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const prompt = await PromptService.getUserPrompt(
      fastify.prisma,
      id,
      request.user!.id
    );

    if (!prompt) {
      return reply.status(404).viewWithCsrf('error', ViewContextBuilder.withError(
        request,
        ERROR_MESSAGES.PROMPTS.NOT_FOUND
      ));
    }

    return reply.viewWithCsrf('prompts/detail', ViewContextBuilder.with(request, {
      prompt,
    }));
  });

  // Save new prompt (htmx endpoint)
  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const { frameworkId, frameworkName, promptText, title } = request.body as {
      frameworkId: string;
      frameworkName: string;
      promptText: string;
      title?: string;
    };

    // Check free tier limit using service
    const hasReachedLimit = await PromptService.hasReachedLimit(
      fastify.prisma,
      request.user!.id,
      USER_CONSTANTS.FREE_TIER_PROMPT_LIMIT,
      request.subscription!.isPremium
    );

    if (hasReachedLimit) {
      return reply.view('partials/limit-reached', {
        limit: USER_CONSTANTS.FREE_TIER_PROMPT_LIMIT,
      });
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

    const prompt = await PromptService.getUserPrompt(
      fastify.prisma,
      id,
      request.user!.id
    );

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
      return reply.status(403).viewWithCsrf('error', ViewContextBuilder.withError(
        request,
        ERROR_MESSAGES.PROMPTS.EXPORT_PREMIUM_ONLY
      ));
    }

    const { id } = request.params as { id: string };

    const prompt = await PromptService.getUserPrompt(
      fastify.prisma,
      id,
      request.user!.id
    );

    if (!prompt) {
      return reply.status(404).viewWithCsrf('error', ViewContextBuilder.withError(
        request,
        ERROR_MESSAGES.PROMPTS.NOT_FOUND
      ));
    }

    // Generate export using services
    const filename = FilenameService.createFilename(prompt.title, 'txt');
    const content = PromptService.generateExportContent(prompt);

    return reply
      .header('Content-Type', 'text/plain')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(content);
  });
};

export default promptRoutes;
