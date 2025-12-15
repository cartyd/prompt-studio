import { FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../plugins/auth';
import { PrismaError } from '../types';

const customCriteriaRoutes: FastifyPluginAsync = async (fastify) => {
  // Get user's custom criteria (premium only)
  fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.subscription?.isPremium) {
      return reply.status(403).send({ error: 'Premium subscription required' });
    }

    const customCriteria = await fastify.prisma.customCriteria.findMany({
      where: { userId: request.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ criteria: customCriteria.map((c: { criteriaName: string }) => c.criteriaName) });
  });

  // Save new custom criteria (premium only)
  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.subscription?.isPremium) {
      return reply.status(403).send({ error: 'Premium subscription required to save custom criteria' });
    }

    const { criteriaName } = request.body as { criteriaName: string };

    if (!criteriaName || criteriaName.trim().length === 0) {
      return reply.status(400).send({ error: 'Criteria name is required' });
    }

    if (criteriaName.length > 200) {
      return reply.status(400).send({ error: 'Criteria name must be 200 characters or less' });
    }

    try {
      const customCriteria = await fastify.prisma.customCriteria.create({
        data: {
          userId: request.user!.id,
          criteriaName: criteriaName.trim(),
        },
      });

      return reply.status(201).send({ criteria: customCriteria.criteriaName });
    } catch (error: unknown) {
      const prismaError = error as PrismaError;
      // Handle duplicate criteria
      if (prismaError.code === 'P2002') {
        return reply.status(409).send({ error: 'This criteria already exists' });
      }
      throw error;
    }
  });

  // Delete custom criteria (premium only)
  fastify.delete('/:criteriaName', { preHandler: requireAuth }, async (request, reply) => {
    if (!request.subscription?.isPremium) {
      return reply.status(403).send({ error: 'Premium subscription required' });
    }

    const { criteriaName } = request.params as { criteriaName: string };

    await fastify.prisma.customCriteria.deleteMany({
      where: {
        userId: request.user!.id,
        criteriaName: decodeURIComponent(criteriaName),
      },
    });

    return reply.status(204).send();
  });
};

export default customCriteriaRoutes;
