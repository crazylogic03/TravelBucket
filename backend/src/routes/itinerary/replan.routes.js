import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { previewReplan, applyReplan } from '../../services/itinerary/replan.service.js';

/** @param {import('fastify').FastifyInstance} app */
export default async function replanRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.post('/trips/:tripId/replan/preview', async (request, reply) => {
    const schema = z.object({ reason: z.string().max(500).optional() });
    const parsed = schema.safeParse(request.body || {});
    try {
      return await previewReplan(
        request.params.tripId,
        request.user.id,
        parsed.success ? parsed.data.reason : undefined,
      );
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/trips/:tripId/replan/apply', async (request, reply) => {
    const schema = z.object({ reason: z.string().max(500).optional() });
    const parsed = schema.safeParse(request.body || {});
    try {
      return await applyReplan(
        request.params.tripId,
        request.user.id,
        parsed.success ? parsed.data.reason : undefined,
      );
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });
}
