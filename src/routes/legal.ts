import { FastifyPluginAsync } from 'fastify';
import { loadUserFromSession } from '../plugins/auth';
import { promises as fs } from 'fs';
import path from 'path';
import { marked } from 'marked';

const legalRoutes: FastifyPluginAsync = async (fastify) => {
  // Privacy Policy
  fastify.get('/privacy', async (request, reply) => {
    await loadUserFromSession(request);

    try {
      const privacyPath = path.join(process.cwd(), 'legal', 'PRIVACY_POLICY.md');
      const content = await fs.readFile(privacyPath, 'utf-8');
      const htmlContent = await marked(content);

      return reply.viewWithCsrf('legal', {
        user: request.user,
        subscription: request.subscription,
        title: 'Privacy Policy',
        content: htmlContent,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send('Error loading privacy policy');
    }
  });

  // Terms of Service
  fastify.get('/terms', async (request, reply) => {
    await loadUserFromSession(request);

    try {
      const termsPath = path.join(process.cwd(), 'legal', 'TERMS_OF_SERVICE.md');
      const content = await fs.readFile(termsPath, 'utf-8');
      const htmlContent = await marked(content);

      return reply.viewWithCsrf('legal', {
        user: request.user,
        subscription: request.subscription,
        title: 'Terms of Service',
        content: htmlContent,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send('Error loading terms of service');
    }
  });
};

export default legalRoutes;
