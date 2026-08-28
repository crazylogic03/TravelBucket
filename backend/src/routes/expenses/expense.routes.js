import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  listExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  expenseSchema,
} from '../../services/expenses/expense.service.js';
import { runBudgetAgent } from '../../ai/agents/budget.agent.js';
import { getOwnedTrip } from '../../services/trips/trip.service.js';

/** @param {import('fastify').FastifyInstance} app */
export default async function expenseRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/trips/:tripId/expenses', async (request) => {
    return listExpenses(request.params.tripId, request.user.id);
  });

  app.post('/trips/:tripId/expenses', async (request, reply) => {
    const parsed = expenseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    try {
      return await addExpense(request.params.tripId, request.user.id, parsed.data);
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.patch('/trips/:tripId/expenses/:expenseId', async (request, reply) => {
    const parsed = expenseSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    try {
      return await updateExpense(
        request.params.tripId,
        request.user.id,
        request.params.expenseId,
        parsed.data,
      );
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.delete('/trips/:tripId/expenses/:expenseId', async (request, reply) => {
    try {
      return await deleteExpense(
        request.params.tripId,
        request.user.id,
        request.params.expenseId,
      );
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.get('/trips/:tripId/budget', async (request, reply) => {
    try {
      const trip = await getOwnedTrip(request.params.tripId, request.user.id);
      const remaining = (trip.destinations || []).filter(
        (d) => d.selected && ['PLANNED', 'CURRENT'].includes(d.status),
      );
      const analysis = await runBudgetAgent({
        trip,
        remainingDestinations: remaining,
        userId: request.user.id,
      });
      return { analysis };
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });
}
