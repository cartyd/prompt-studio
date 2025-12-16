import { FastifyPluginAsync } from 'fastify';
import { loadUserFromSession } from '../plugins/auth';
import { loadLegalDocument } from '../utils/legal';

const legalRoutes: FastifyPluginAsync = async (fastify) => {
  // Privacy Policy
  fastify.get('/privacy', async (request, reply) => {
    await loadUserFromSession(request);
    
    return loadLegalDocument(request, reply, fastify, {
      filename: 'PRIVACY_POLICY.md',
      title: 'Privacy Policy',
      errorMessage: 'Error loading privacy policy'
    });
  });

  // Terms of Service
  fastify.get('/terms', async (request, reply) => {
    await loadUserFromSession(request);
    
    return loadLegalDocument(request, reply, fastify, {
      filename: 'TERMS_OF_SERVICE.md',
      title: 'Terms of Service',
      errorMessage: 'Error loading terms of service'
    });
  });
};

export default legalRoutes;
