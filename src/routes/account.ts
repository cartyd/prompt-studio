import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcrypt';
import { ERROR_MESSAGES } from '../constants';
import { validatePassword } from '../validation';
import { sendPasswordChangedNotification } from '../utils/email';
import { logEvent } from '../utils/analytics';
import { requireAuth } from '../plugins/auth';

const accountRoutes: FastifyPluginAsync = async (fastify) => {
  // Account settings page
  fastify.get('/settings', {
    preHandler: requireAuth,
  }, async (request, reply) => {
    const user = request.user!;
    
    return reply.viewWithCsrf('account/settings', {
      user,
      success: null,
      error: null,
      passwordSuccess: null,
      passwordError: null,
    });
  });

  // Change password handler
  fastify.post('/change-password', {
    preHandler: [requireAuth, fastify.csrfProtection],
  }, async (request, reply) => {
    const user = request.user!;
    const { currentPassword, newPassword, confirmPassword } = request.body as {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    };

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return reply.viewWithCsrf('account/settings', {
        user,
        success: null,
        error: null,
        passwordSuccess: null,
        passwordError: ERROR_MESSAGES.AUTH.ALL_FIELDS_REQUIRED,
      });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return reply.viewWithCsrf('account/settings', {
        user,
        success: null,
        error: null,
        passwordSuccess: null,
        passwordError: ERROR_MESSAGES.ACCOUNT.CURRENT_PASSWORD_INCORRECT,
      });
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      return reply.viewWithCsrf('account/settings', {
        user,
        success: null,
        error: null,
        passwordSuccess: null,
        passwordError: ERROR_MESSAGES.AUTH.PASSWORD_MISMATCH,
      });
    }

    // Check new password is different
    const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (samePassword) {
      return reply.viewWithCsrf('account/settings', {
        user,
        success: null,
        error: null,
        passwordSuccess: null,
        passwordError: ERROR_MESSAGES.ACCOUNT.NEW_PASSWORD_SAME,
      });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return reply.viewWithCsrf('account/settings', {
        user,
        success: null,
        error: null,
        passwordSuccess: null,
        passwordError: passwordValidation.error!,
      });
    }

    // Update password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        lastPasswordChange: new Date(),
      },
    });

    // Log the event
    await logEvent(fastify.prisma, request, user.id, 'password_changed');

    // Send notification email
    try {
      await sendPasswordChangedNotification(user.email, user.name);
    } catch (err) {
      fastify.log.error({ err }, 'Failed to send password changed notification');
    }

    // Reload user to get updated data
    const updatedUser = await fastify.prisma.user.findUnique({
      where: { id: user.id },
    });

    return reply.viewWithCsrf('account/settings', {
      user: updatedUser,
      success: null,
      error: null,
      passwordSuccess: ERROR_MESSAGES.ACCOUNT.PASSWORD_CHANGED,
      passwordError: null,
    });
  });
};

export default accountRoutes;
