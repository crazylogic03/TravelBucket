import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  getCopilotSession,
  sendCopilotMessage,
  clearCopilotSession,
} from '../../services/copilot/copilot.service.js';

const messageSchema = z.object({
  message: z.string().min(1).max(2000),
  mode: z.enum(['PLANNING', 'ACTIVE_TRIP', 'GENERAL']).optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
});

/** @param {import('fastify').FastifyInstance} app */
export default async function copilotRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/trips/:tripId/copilot', async (request, reply) => {
    const mode =
      request.query.mode === 'ACTIVE_TRIP' ? 'ACTIVE_TRIP' : 'PLANNING';
    try {
      return await getCopilotSession(request.params.tripId, request.user.id, mode);
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/trips/:tripId/copilot/messages', async (request, reply) => {
    const parsed = messageSchema.safeParse(request.body || {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid message payload' });
    }
    try {
      const mode =
        parsed.data.mode ||
        (request.query.mode === 'ACTIVE_TRIP' ? 'ACTIVE_TRIP' : 'PLANNING');
      return await sendCopilotMessage({
        tripId: request.params.tripId,
        userId: request.user.id,
        message: parsed.data.message,
        mode,
        location: parsed.data.location,
      });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.delete('/trips/:tripId/copilot', async (request, reply) => {
    const mode =
      request.query.mode === 'ACTIVE_TRIP' ? 'ACTIVE_TRIP' : 'PLANNING';
    try {
      return await clearCopilotSession(
        request.params.tripId,
        request.user.id,
        mode,
      );
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });
}
