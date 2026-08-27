import { requireAuth } from '../../middleware/auth.middleware.js';
import { getWeather } from '../../services/weather/weather.service.js';

/** @param {import('fastify').FastifyInstance} app */
export default async function weatherRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/weather', async (request, reply) => {
    const lat = Number(request.query.lat);
    const lng = Number(request.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return reply.status(400).send({ error: 'lat and lng are required' });
    }

    try {
      const weather = await getWeather(lat, lng);
      return { weather };
    } catch (err) {
      request.log.warn(err);
      return reply.status(err.statusCode || 502).send({
        error: 'Weather unavailable',
        weather: null,
      });
    }
  });
}
