import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/env.js';
import { getPrisma } from './db/prisma.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth/auth.routes.js';
import tripRoutes from './routes/trips/trip.routes.js';
import mapsRoutes from './routes/maps/maps.routes.js';
import weatherRoutes from './routes/weather/weather.routes.js';
import placesRoutes from './routes/places/places.routes.js';
import destinationRoutes from './routes/destinations/destination.routes.js';
import itineraryRoutes from './routes/itinerary/itinerary.routes.js';
import aiRoutes from './routes/ai/ai.routes.js';
import paymentRoutes from './routes/payments/payment.routes.js';
import liveTripRoutes from './routes/trips/live.routes.js';
import expenseRoutes from './routes/expenses/expense.routes.js';
import copilotRoutes from './routes/copilot/copilot.routes.js';
import replanRoutes from './routes/itinerary/replan.routes.js';
import summaryRoutes from './routes/trips/summary.routes.js';

/**
 * Build and configure the Fastify application.
 * @returns {import('fastify').FastifyInstance}
 */
export async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'info' : 'debug',
    },
  });

  app.decorate('prisma', getPrisma());

  await app.register(cors, {
    origin: config.frontendUrl,
    credentials: true,
  });

  await app.register(cookie, {
    secret: config.sessionSecret,
    parseOptions: {},
  });

  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
  });

  await app.register(healthRoutes, { prefix: '/api' });
  await app.register(authRoutes, { prefix: '/api' });
  await app.register(tripRoutes, { prefix: '/api' });
  await app.register(mapsRoutes, { prefix: '/api' });
  await app.register(weatherRoutes, { prefix: '/api' });
  await app.register(placesRoutes, { prefix: '/api' });
  await app.register(destinationRoutes, { prefix: '/api' });
  await app.register(itineraryRoutes, { prefix: '/api' });
  await app.register(aiRoutes, { prefix: '/api' });
  await app.register(paymentRoutes, { prefix: '/api' });
  await app.register(liveTripRoutes, { prefix: '/api' });
  await app.register(expenseRoutes, { prefix: '/api' });
  await app.register(copilotRoutes, { prefix: '/api' });
  await app.register(replanRoutes, { prefix: '/api' });
  await app.register(summaryRoutes, { prefix: '/api' });

  app.addHook('onClose', async () => {
    await app.prisma.$disconnect();
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      error: statusCode >= 500 ? 'Internal server error' : error.message,
    });
  });

  return app;
}
