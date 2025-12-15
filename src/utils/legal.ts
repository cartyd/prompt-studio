import { FastifyRequest, FastifyReply } from 'fastify';
import { promises as fs } from 'fs';
import path from 'path';
import { marked } from 'marked';

interface LegalDocumentConfig {
  filename: string;
  title: string;
  errorMessage: string;
}

/**
 * Load and render a legal document (privacy policy, terms of service, etc.)
 */
export async function loadLegalDocument(
  request: FastifyRequest,
  reply: FastifyReply,
  fastify: any,
  config: LegalDocumentConfig
): Promise<any> {
  try {
    const documentPath = path.join(process.cwd(), 'legal', config.filename);
    const content = await fs.readFile(documentPath, 'utf-8');
    const htmlContent = await marked(content);

    return reply.viewWithCsrf('legal', {
      user: request.user,
      subscription: request.subscription,
      title: config.title,
      content: htmlContent,
    });
  } catch (error) {
    fastify.log.error(error);
    return reply.code(500).send(config.errorMessage);
  }
}