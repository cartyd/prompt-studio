import { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../plugins/auth';
import { FREE_PROMPT_LIMIT } from '../types';
import { ERROR_MESSAGES } from '../constants';

const promptRoutes: FastifyPluginAsync = async (fastify) => {
  // List user's prompts
  fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).redirect('/auth/login');
    }

    const prompts = await fastify.prisma.prompt.findMany({
      where: { userId: request.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return reply.view('prompts/list', {
      prompts,
      user: request.user,
      subscription: request.subscription,
    });
  });

  // View single prompt
  fastify.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).redirect('/auth/login');
    }

    const { id } = request.params as { id: string };

    const prompt = await fastify.prisma.prompt.findFirst({
      where: {
        id,
        userId: request.user.id,
      },
    });

    if (!prompt) {
      return reply.status(404).view('error', {
        message: ERROR_MESSAGES.PROMPTS.NOT_FOUND,
        user: request.user,
      });
    }

    return reply.view('prompts/detail', {
      prompt,
      user: request.user,
      subscription: request.subscription,
    });
  });

  // Save new prompt (htmx endpoint)
  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.user || !request.subscription) {
      return reply.status(401).redirect('/auth/login');
    }

    const { frameworkId, frameworkName, promptText, title } = request.body as {
      frameworkId: string;
      frameworkName: string;
      promptText: string;
      title?: string;
    };

    // Check free tier limit
    if (!request.subscription.isPremium) {
      const promptCount = await fastify.prisma.prompt.count({
        where: { userId: request.user.id },
      });

      if (promptCount >= FREE_PROMPT_LIMIT) {
        return reply.view('partials/limit-reached', {
          limit: FREE_PROMPT_LIMIT,
        });
      }
    }

    // Create the prompt
    const prompt = await fastify.prisma.prompt.create({
      data: {
        userId: request.user.id,
        frameworkType: frameworkId,
        title: title || `${frameworkName} Prompt`,
        finalPromptText: promptText,
      },
    });

    return reply.view('partials/prompt-saved', {
      promptId: prompt.id,
    });
  });

  // Delete prompt (htmx endpoint)
  fastify.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send('');
    }

    const { id } = request.params as { id: string };

    const prompt = await fastify.prisma.prompt.findFirst({
      where: {
        id,
        userId: request.user.id,
      },
    });

    if (!prompt) {
      return reply.status(404).send('');
    }

    await fastify.prisma.prompt.delete({
      where: { id },
    });

    return reply.send('');
  });

  // Export prompt (premium only)
  fastify.get('/:id/export', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.user || !request.subscription) {
      return reply.status(401).redirect('/auth/login');
    }

    if (!request.subscription.isPremium) {
      return reply.status(403).view('error', {
        message: ERROR_MESSAGES.PROMPTS.EXPORT_PREMIUM_ONLY,
        user: request.user,
      });
    }

    const { id } = request.params as { id: string };

    const prompt = await fastify.prisma.prompt.findFirst({
      where: {
        id,
        userId: request.user.id,
      },
    });

    if (!prompt) {
      return reply.status(404).view('error', {
        message: ERROR_MESSAGES.PROMPTS.NOT_FOUND,
        user: request.user,
      });
    }

    const filename = `${prompt.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    const content = `# ${prompt.title}\n\nFramework: ${prompt.frameworkType}\nCreated: ${prompt.createdAt.toISOString()}\n\n---\n\n${prompt.finalPromptText}`;

    return reply
      .header('Content-Type', 'text/plain')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(content);
  });
};

export default promptRoutes;
