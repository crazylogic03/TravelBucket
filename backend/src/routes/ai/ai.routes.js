import { requireAuth } from '../../middleware/auth.middleware.js';
import { groqKeyPool } from '../../ai/key-pool/groqKeyPool.js';
import { toolDefinitions } from '../../ai/tools/index.js';

/** @param {import('fastify').FastifyInstance} app */
export default async function aiRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/ai/health', async () => ({
    provider: 'groq',
    keysConfigured: groqKeyPool.hasKeys(),
    keyHealth: groqKeyPool.getHealth(),
  }));

  app.get('/ai/tools', async () => ({
    tools: toolDefinitions.map((t) => t.function.name),
  }));
}
