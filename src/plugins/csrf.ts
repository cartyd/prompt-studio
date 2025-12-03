import { FastifyPluginAsync, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

const csrfPlugin: FastifyPluginAsync = async (fastify) => {
  // Decorate reply with a wrapper around view that injects CSRF token
  fastify.decorateReply('viewWithCsrf', async function (
    this: FastifyReply,
    page: string,
    data?: Record<string, any>
  ) {
    // Generate CSRF token
    const csrfToken = await this.generateCsrf();
    
    // Merge data with CSRF token
    const viewData = {
      ...data,
      csrfToken,
    };
    
    // Use the original view method
    return this.view(page, viewData);
  });
};

export default fp(csrfPlugin, {
  name: 'csrf-plugin',
  dependencies: ['@fastify/csrf-protection'],
});
