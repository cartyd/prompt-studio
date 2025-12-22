import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { ERROR_MESSAGES, SECURITY_CONSTANTS } from '../constants';
import { validatePassword } from '../validation';
import { sendPasswordChangedNotification } from '../utils/email';
import { logEvent } from '../utils/analytics';
import { requireAuth } from '../plugins/auth';
import { ViewContextBuilder } from '../utils/view-context';

/**
 * Helper to render account settings page with password change messages
 * Eliminates duplication of error handling view rendering
 */
function renderAccountSettings(
  request: FastifyRequest,
  reply: FastifyReply,
  options: {
    passwordError?: string | null;
    passwordSuccess?: string | null;
  }
) {
  return reply.viewWithCsrf('account/settings', ViewContextBuilder.withMessages(request, {
    success: null,
    error: null,
    passwordSuccess: options.passwordSuccess || null,
    passwordError: options.passwordError || null,
  }));
}

const accountRoutes: FastifyPluginAsync = async (fastify) => {
  // Account settings page
  fastify.get('/settings', {
    preHandler: requireAuth,
  }, async (request, reply) => {
    return renderAccountSettings(request, reply, {});
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
      return renderAccountSettings(request, reply, {
        passwordError: ERROR_MESSAGES.AUTH.ALL_FIELDS_REQUIRED,
      });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!validPassword) {
      return renderAccountSettings(request, reply, {
        passwordError: ERROR_MESSAGES.ACCOUNT.CURRENT_PASSWORD_INCORRECT,
      });
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      return renderAccountSettings(request, reply, {
        passwordError: ERROR_MESSAGES.AUTH.PASSWORD_MISMATCH,
      });
    }

    // Check new password is different
    const samePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (samePassword) {
      return renderAccountSettings(request, reply, {
        passwordError: ERROR_MESSAGES.ACCOUNT.NEW_PASSWORD_SAME,
      });
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return renderAccountSettings(request, reply, {
        passwordError: passwordValidation.error!,
      });
    }

    // Update password
    const newPasswordHash = await bcrypt.hash(newPassword, SECURITY_CONSTANTS.BCRYPT_SALT_ROUNDS);
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

    // Update request.user to reflect changes
    if (updatedUser) {
      request.user = updatedUser as any;  // Safe cast as structure matches AuthUser
    }
    
    return renderAccountSettings(request, reply, {
      passwordSuccess: ERROR_MESSAGES.ACCOUNT.PASSWORD_CHANGED,
    });
  });
};

export default accountRoutes;
