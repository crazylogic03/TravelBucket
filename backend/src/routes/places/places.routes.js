import { requireAuth } from '../../middleware/auth.middleware.js';
import { searchPlaces, distanceKm } from '../../services/places/places.service.js';
import { getRouteSuggestions } from '../../services/destinations/routeSuggestions.service.js';
import {
  getPopularDestinations,
  getExploreVibes,
} from '../../services/places/popularDestinations.service.js';

/** @param {import('fastify').FastifyInstance} app */
export default async function placesRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/places/popular', async (request, reply) => {
    try {
      const destinations = await getPopularDestinations();
      return { destinations };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Could not load destinations', destinations: [] });
    }
  });

  app.get('/places/vibes', async (request, reply) => {
    try {
      const vibes = await getExploreVibes();
      return { vibes };
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: 'Could not load vibes', vibes: [] });
    }
  });

  app.post('/places/route-suggestions', async (request, reply) => {
    const { start, destination, interests } = request.body || {};
    if (!start?.latitude || !start?.longitude || !start?.name) {
      return reply.status(400).send({ error: 'Start location is required' });
    }
    if (!destination?.latitude || !destination?.longitude || !destination?.name) {
      return reply.status(400).send({ error: 'Destination is required' });
    }
    try {
      const result = await getRouteSuggestions({ start, destination, interests });
      return result;
    } catch (err) {
      request.log.error(err);
      return reply.status(err.statusCode || 502).send({
        error: err.message || 'Could not load route suggestions',
        suggestions: [],
      });
    }
  });

  app.get('/places/search', async (request, reply) => {
    const q = String(request.query.q || '').trim();
    if (q.length < 2) {
      return reply.status(400).send({ error: 'Query must be at least 2 characters' });
    }

    const lat = request.query.lat != null ? Number(request.query.lat) : null;
    const lng = request.query.lng != null ? Number(request.query.lng) : null;

    try {
      const results = await searchPlaces({
        query: q,
        proximity: lat != null && lng != null ? { lat, lng } : undefined,
        limit: Number(request.query.limit) || 8,
      });

      const enriched = results.map((r) => ({
        ...r,
        distanceKm:
          lat != null && lng != null && r.latitude != null
            ? Math.round(distanceKm(lat, lng, r.latitude, r.longitude) * 10) / 10
            : null,
      }));

      return { results: enriched };
    } catch (err) {
      request.log.error(err);
      return reply.status(err.statusCode || 502).send({
        error: err.message || 'Places search unavailable',
        results: [],
      });
    }
  });
}
