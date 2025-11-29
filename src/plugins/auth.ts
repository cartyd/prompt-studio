import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { SubscriptionInfo, AuthUser, SubscriptionTier } from '../types';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.session.userId) {
    return reply.status(401).redirect('/auth/login');
  }

  const user = await request.server.prisma.user.findUnique({
    where: { id: request.session.userId },
  });

  if (!user) {
    request.session.set('userId', undefined);
    return reply.status(401).redirect('/auth/login');
  }

  request.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    subscriptionTier: user.subscriptionTier as SubscriptionTier,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
  };

  request.subscription = getSubscriptionInfo(request.user);
}

export async function loadUserFromSession(request: FastifyRequest): Promise<void> {
  if (!request.session.userId) {
    return;
  }

  const user = await request.server.prisma.user.findUnique({
    where: { id: request.session.userId },
  });

  if (user) {
    request.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier as SubscriptionTier,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    };
    request.subscription = getSubscriptionInfo(request.user);
  }
}

export function getSubscriptionInfo(user: AuthUser): SubscriptionInfo {
  const isPremium =
    user.subscriptionTier === 'premium' &&
    user.subscriptionExpiresAt !== null &&
    user.subscriptionExpiresAt > new Date();

  return {
    tier: isPremium ? 'premium' : 'free',
    isPremium,
  };
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('requireAuth', requireAuth);
};

export default fp(authPlugin);
