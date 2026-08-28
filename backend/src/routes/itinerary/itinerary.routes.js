import { requireAuth } from '../../middleware/auth.middleware.js';
import { runOptimization, finalizeTrip } from '../../services/itinerary/optimizer.service.js';
import { getOwnedTrip } from '../../services/trips/trip.service.js';

function serializeTrip(trip) {
  if (!trip) return null;
  return {
    ...trip,
    budgetAmount: trip.budgetAmount != null ? Number(trip.budgetAmount) : null,
    startDate:
      trip.startDate instanceof Date
        ? trip.startDate.toISOString().slice(0, 10)
        : trip.startDate,
    endDate:
      trip.endDate instanceof Date ? trip.endDate.toISOString().slice(0, 10) : trip.endDate,
    destinations: trip.destinations?.map((d) => ({
      ...d,
      estimatedCost: d.estimatedCost != null ? Number(d.estimatedCost) : null,
    })),
    bookings: trip.bookings?.map((b) => ({
      ...b,
      amount: b.amount != null ? Number(b.amount) : null,
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
export default async function itineraryRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/trips/:tripId/itinerary', async (request) => {
    const trip = await getOwnedTrip(request.params.tripId, request.user.id);
    return {
      itineraryDays: serializeTrip(trip).itineraryDays || [],
    };
  });

  app.post('/trips/:tripId/optimize', async (request, reply) => {
    try {
      const result = await runOptimization(request.params.tripId, request.user.id);
      return {
        score: result.score,
        whyThisPlan: result.whyThisPlan,
        meta: result.meta,
        trip: serializeTrip(result.trip),
      };
    } catch (err) {
      request.log.error(err);
      return reply.status(err.statusCode || 500).send({
        error: err.message || 'Optimization failed',
      });
    }
  });

  app.post('/trips/:tripId/finalize', async (request, reply) => {
    try {
      const trip = await finalizeTrip(request.params.tripId, request.user.id);
      return { trip: serializeTrip(trip) };
    } catch (err) {
      request.log.error(err);
      return reply.status(err.statusCode || 500).send({
        error: err.message || 'Finalize failed',
      });
    }
  });
}
