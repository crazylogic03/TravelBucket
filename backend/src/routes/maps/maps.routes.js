import { config } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const MAPBOX_TIMEOUT_MS = 8000;

/**
 * @param {string} path
 * @param {Record<string, string>} params
 */
async function mapboxFetch(path, params = {}) {
  if (!config.mapboxAccessToken) {
    const err = new Error('Mapbox is not configured');
    err.statusCode = 503;
    throw err;
  }

  const url = new URL(`https://api.mapbox.com${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('access_token', config.mapboxAccessToken);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MAPBOX_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      const err = new Error('Mapbox request failed');
      err.statusCode = 502;
      throw err;
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** @param {import('fastify').FastifyInstance} app */
export default async function mapsRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/maps/geocode', async (request, reply) => {
    const q = String(request.query.q || '').trim();
    if (q.length < 2) {
      return reply.status(400).send({ error: 'Query must be at least 2 characters' });
    }

    try {
      const data = await mapboxFetch(
        `/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`,
        {
          limit: '6',
          types: 'place,locality,region,country,address',
          language: 'en',
        },
      );

      const results = (data.features || []).map((f) => ({
        id: f.id,
        name: f.place_name,
        shortName: f.text,
        latitude: f.center?.[1],
        longitude: f.center?.[0],
        placeType: f.place_type?.[0] || null,
      }));

      return { results };
    } catch (err) {
      request.log.error(err);
      return reply.status(err.statusCode || 502).send({
        error: err.message || 'Geocoding unavailable',
        results: [],
      });
    }
  });

  app.get('/maps/directions', async (request, reply) => {
    const { fromLng, fromLat, toLng, toLat, profile = 'driving' } = request.query;
    if ([fromLng, fromLat, toLng, toLat].some((v) => v == null || v === '')) {
      return reply.status(400).send({ error: 'fromLng, fromLat, toLng, toLat are required' });
    }

    const allowed = new Set(['driving', 'walking', 'cycling', 'driving-traffic']);
    const mode = allowed.has(String(profile)) ? String(profile) : 'driving';

    try {
      const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
      const data = await mapboxFetch(`/directions/v5/mapbox/${mode}/${coords}`, {
        geometries: 'geojson',
        overview: 'simplified',
      });

      const route = data.routes?.[0];
      if (!route) {
        return { route: null, message: 'No route found' };
      }

      return {
        route: {
          distanceMeters: route.distance,
          durationSeconds: route.duration,
          geometry: route.geometry,
        },
      };
    } catch (err) {
      request.log.error(err);
      return reply.status(err.statusCode || 502).send({
        error: err.message || 'Directions unavailable',
        route: null,
      });
    }
  });

  app.get('/maps/token', async () => {
    const token = config.mapboxAccessToken || null;
    if (!token) {
      return {
        token: null,
        message: 'Mapbox is not configured on the server (MAPBOX_ACCESS_TOKEN).',
      };
    }
    // Only expose public (pk.) tokens to the browser. Secret (sk.) tokens stay server-side.
    if (token.startsWith('sk.')) {
      return {
        token: null,
        message:
          'MAPBOX_ACCESS_TOKEN is a secret token. Use a public pk. token for client map rendering; keep sk. tokens server-only.',
      };
    }
    return { token };
  });
}
