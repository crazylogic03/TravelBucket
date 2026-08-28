import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  startTrip,
  markDestinationVisited,
  markDestinationSkipped,
  completeTrip,
  calculateProgress,
} from '../../services/trips/liveTrip.service.js';
import { getOwnedTrip } from '../../services/trips/trip.service.js';
import { z } from 'zod';

function serializeTrip(trip) {
  if (!trip) return null;
  const destinations = trip.destinations?.map((d) => ({
    ...d,
    estimatedCost: d.estimatedCost != null ? Number(d.estimatedCost) : null,
  }));
  return {
    ...trip,
    budgetAmount: trip.budgetAmount != null ? Number(trip.budgetAmount) : null,
    startDate:
      trip.startDate instanceof Date
        ? trip.startDate.toISOString().slice(0, 10)
        : trip.startDate,
    endDate:
      trip.endDate instanceof Date ? trip.endDate.toISOString().slice(0, 10) : trip.endDate,
    destinations,
    progressPercentage: destinations
      ? calculateProgress(destinations)
      : trip.progressPercentage,
    expenses: trip.expenses?.map((e) => ({
      ...e,
      amount: Number(e.amount),
      expenseDate:
        e.expenseDate instanceof Date
          ? e.expenseDate.toISOString().slice(0, 10)
          : e.expenseDate,
    })),
    itineraryDays: trip.itineraryDays?.map((day) => ({
      ...day,
      date: day.date instanceof Date ? day.date.toISOString().slice(0, 10) : day.date,
      estimatedCost: day.estimatedCost != null ? Number(day.estimatedCost) : null,
      items: day.items?.map((item) => ({
        ...item,
        estimatedCost: item.estimatedCost != null ? Number(item.estimatedCost) : null,
      })),
    })),
  };
}

/** @param {import('fastify').FastifyInstance} app */
export default async function liveTripRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.post('/trips/:tripId/start', async (request, reply) => {
    try {
      const trip = await startTrip(request.params.tripId, request.user.id);
      return { trip: serializeTrip(trip) };
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/trips/:tripId/complete', async (request, reply) => {
    try {
      const trip = await completeTrip(request.params.tripId, request.user.id);
      return { trip: serializeTrip(trip) };
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.get('/trips/:tripId/live', async (request) => {
    const trip = await getOwnedTrip(request.params.tripId, request.user.id);
    const destinations = trip.destinations || [];
    const current = destinations.find((d) => d.status === 'CURRENT');
    const next = destinations.find(
      (d) => d.selected && d.status === 'PLANNED',
    );
    const remaining = destinations.filter(
      (d) => d.selected && ['PLANNED', 'CURRENT'].includes(d.status),
    );
    const visited = destinations.filter((d) => d.status === 'VISITED');
    const skipped = destinations.filter((d) => d.status === 'SKIPPED');

    return {
      trip: serializeTrip(trip),
      live: {
        current,
        next,
        remaining,
        visited,
        skipped,
        progressPercentage: calculateProgress(destinations),
      },
    };
  });

  app.post('/trips/:tripId/destinations/:destinationId/visit', async (request, reply) => {
    try {
      const result = await markDestinationVisited(
        request.params.tripId,
        request.user.id,
        request.params.destinationId,
      );
      return {
        trip: serializeTrip(result.trip),
        suggestReplan: result.suggestReplan,
      };
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/trips/:tripId/destinations/:destinationId/skip', async (request, reply) => {
    const schema = z.object({ reason: z.string().max(500).optional() });
    const parsed = schema.safeParse(request.body || {});
    try {
      const result = await markDestinationSkipped(
        request.params.tripId,
        request.user.id,
        request.params.destinationId,
        parsed.success ? parsed.data.reason : undefined,
      );
      return {
        trip: serializeTrip(result.trip),
        suggestReplan: result.suggestReplan,
      };
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });
}
