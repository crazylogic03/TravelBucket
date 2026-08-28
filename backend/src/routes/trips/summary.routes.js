import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  getTripSummary,
  completeTripWithSummary,
} from '../../services/trips/summary.service.js';

/** @param {import('fastify').FastifyInstance} app */
export default async function summaryRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/trips/:tripId/summary', async (request, reply) => {
    try {
      return await getTripSummary(request.params.tripId, request.user.id);
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/trips/:tripId/summary/complete', async (request, reply) => {
    try {
      return await completeTripWithSummary(request.params.tripId, request.user.id);
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });
}
