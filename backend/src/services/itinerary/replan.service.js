import { getPrisma } from '../../db/prisma.js';
import { getOwnedTrip } from '../trips/trip.service.js';
import { runReplanningAgent } from '../../ai/agents/replanning.agent.js';
import { runOptimization } from '../itinerary/optimizer.service.js';

/**
 * Preview replan diff without persisting.
 */
export async function previewReplan(tripId, userId, reason) {
  const trip = await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();

  const destinations = await prisma.destination.findMany({
    where: { tripId },
    orderBy: { sortOrder: 'asc' },
  });

  const itineraryDays = await prisma.itineraryDay.findMany({
    where: { tripId },
    orderBy: { dayNumber: 'asc' },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  });

  const { diff, meta } = await runReplanningAgent({
    trip,
    destinations,
    itineraryDays,
    reason,
    userId,
  });

  return { diff, meta, applyAvailable: true };
}

/**
 * Apply replan — re-optimizes remaining destinations and logs event.
 */
export async function applyReplan(tripId, userId, reason) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();

  const destinations = await prisma.destination.findMany({
    where: { tripId, selected: true },
    orderBy: { sortOrder: 'asc' },
  });

  const remaining = destinations.filter((d) =>
    ['PLANNED', 'CURRENT'].includes(d.status),
  );

  if (!remaining.length) {
    const err = new Error('No remaining destinations to replan');
    err.statusCode = 400;
    throw err;
  }

  const preview = await previewReplan(tripId, userId, reason);

  const optimizeResult = await runOptimization(tripId, userId, { onlyRemaining: true });

  await prisma.tripEvent.create({
    data: {
      tripId,
      userId,
      type: 'ITINERARY_REPLANNED',
      metadata: {
        reason: reason || null,
        diff: preview.diff,
        remainingCount: remaining.length,
      },
    },
  });

  return {
    diff: preview.diff,
    trip: optimizeResult.trip,
    score: optimizeResult.score,
    whyThisPlan: optimizeResult.whyThisPlan,
    meta: { ...preview.meta, optimize: optimizeResult.meta },
  };
}
