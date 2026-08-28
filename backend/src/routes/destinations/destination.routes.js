import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  runDiscoveryPipeline,
  setDestinationSelection,
  reorderDestinations,
  serializeDestination,
} from '../../services/destinations/discovery.service.js';
import { addRouteStopsToTrip } from '../../services/destinations/routeSuggestions.service.js';
import { getOwnedTrip } from '../../services/trips/trip.service.js';
import { getPrisma } from '../../db/prisma.js';
import { z } from 'zod';

/** @param {import('fastify').FastifyInstance} app */
export default async function destinationRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/trips/:tripId/destinations', async (request) => {
    await getOwnedTrip(request.params.tripId, request.user.id);
    const prisma = getPrisma();
    const destinations = await prisma.destination.findMany({
      where: { tripId: request.params.tripId },
      orderBy: [{ selected: 'desc' }, { sortOrder: 'asc' }],
    });
    return { destinations: destinations.map(serializeDestination) };
  });

  app.post('/trips/:tripId/route-stops', async (request, reply) => {
    const schema = z.object({
      stops: z
        .array(
          z.object({
            name: z.string().min(1),
            latitude: z.number(),
            longitude: z.number(),
            description: z.string().optional().nullable(),
            reason: z.string().optional().nullable(),
            imageUrl: z.string().optional().nullable(),
          }),
        )
        .min(1),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed' });
    }
    try {
      const prisma = getPrisma();
      const created = await addRouteStopsToTrip(
        request.params.tripId,
        request.user.id,
        parsed.data.stops,
        prisma,
        getOwnedTrip,
      );
      return { destinations: created.map(serializeDestination) };
    } catch (err) {
      request.log.error(err);
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/trips/:tripId/discover', async (request, reply) => {
    try {
      const stages = [];
      const result = await runDiscoveryPipeline(
        request.params.tripId,
        request.user.id,
        (stage) => stages.push(stage),
      );
      return { ...result, stages };
    } catch (err) {
      request.log.error(err);
      return reply.status(err.statusCode || 500).send({
        error: err.message || 'Discovery failed',
      });
    }
  });

  app.patch('/trips/:tripId/destinations/:destinationId', async (request, reply) => {
    const schema = z.object({
      selected: z.boolean().optional(),
      skip: z.boolean().optional(),
    });
    const parsed = schema.safeParse(request.body || {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed' });
    }

    const prisma = getPrisma();
    await getOwnedTrip(request.params.tripId, request.user.id);

    if (parsed.data.skip) {
      const dest = await prisma.destination.updateMany({
        where: { id: request.params.destinationId, tripId: request.params.tripId },
        data: { selected: false, status: 'SKIPPED', skippedAt: new Date() },
      });
      if (!dest.count) return reply.status(404).send({ error: 'Destination not found' });
    } else if (typeof parsed.data.selected === 'boolean') {
      await setDestinationSelection(
        request.params.tripId,
        request.user.id,
        request.params.destinationId,
        parsed.data.selected,
      );
      if (parsed.data.selected) {
        await prisma.destination.updateMany({
          where: { id: request.params.destinationId, tripId: request.params.tripId },
          data: { status: 'PLANNED', skippedAt: null, skipReason: null },
        });
      }
    }

    const destination = await prisma.destination.findFirst({
      where: { id: request.params.destinationId, tripId: request.params.tripId },
    });
    return { destination: serializeDestination(destination) };
  });

  app.put('/trips/:tripId/destinations/reorder', async (request, reply) => {
    const schema = z.object({ orderedIds: z.array(z.string().uuid()).min(1) });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed' });
    }
    const destinations = await reorderDestinations(
      request.params.tripId,
      request.user.id,
      parsed.data.orderedIds,
    );
    return { destinations: destinations.map(serializeDestination) };
  });
}
