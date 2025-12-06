import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { SubscriptionInfo, AuthUser, SubscriptionTier } from '../types';

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.session.userId) {
    return reply.redirect('/auth/login');
  }

  const user = await request.server.prisma.user.findUnique({
    where: { id: request.session.userId },
  });

  if (!user) {
    await request.session.destroy();
    return reply.redirect('/auth/login');
  }

  request.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    subscriptionTier: user.subscriptionTier as SubscriptionTier,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
  };

  request.subscription = getSubscriptionInfo(request.user);
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  // First ensure user is authenticated
  await requireAuth(request, reply);
  
  // Check if reply was already sent (e.g., redirect to login)
  if (reply.sent) {
    return;
  }

  // Check if user is admin
  if (!request.user?.isAdmin) {
    return reply.status(403).view('errors/403', {
      user: request.user,
      message: 'Access denied. Admin privileges required.',
    });
  }
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
      isAdmin: user.isAdmin,
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
