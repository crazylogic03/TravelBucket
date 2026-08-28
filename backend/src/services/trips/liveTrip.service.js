import { getPrisma } from '../../db/prisma.js';
import { getOwnedTrip } from '../trips/trip.service.js';

/**
 * Start a planned trip → ACTIVE.
 */
export async function startTrip(tripId, userId) {
  const trip = await getOwnedTrip(tripId, userId);

  if (trip.status === 'ACTIVE') {
    return trip;
  }
  if (trip.status !== 'PLANNED' && trip.status !== 'DRAFT') {
    const err = new Error(`Cannot start a trip with status ${trip.status}`);
    err.statusCode = 400;
    throw err;
  }

  const prisma = getPrisma();

  // Mark first selected destination as CURRENT
  const first = await prisma.destination.findFirst({
    where: { tripId, selected: true, status: { in: ['PLANNED', 'CURRENT'] } },
    orderBy: { sortOrder: 'asc' },
  });

  if (first) {
    await prisma.destination.update({
      where: { id: first.id },
      data: { status: 'CURRENT' },
    });
  }

  return prisma.trip.update({
    where: { id: tripId },
    data: {
      status: 'ACTIVE',
      startedAt: new Date(),
      progressPercentage: 0,
      tripEvents: {
        create: [
          { userId, type: 'TRIP_STARTED' },
          ...(first
            ? [
                {
                  userId,
                  type: 'DESTINATION_CURRENT',
                  metadata: { destinationId: first.id, name: first.name },
                },
              ]
            : []),
        ],
      },
    },
    include: {
      preference: true,
      destinations: { orderBy: { sortOrder: 'asc' } },
      bookings: true,
      expenses: true,
      itineraryDays: {
        orderBy: { dayNumber: 'asc' },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  });
}

/**
 * Progress = visited / (selected destinations that are not permanently removed).
 * Skipped are excluded from denominator (not counted as visited).
 */
export function calculateProgress(destinations) {
  const selected = (destinations || []).filter((d) => d.selected);
  const countable = selected.filter((d) => d.status !== 'SKIPPED');
  if (!countable.length) {
    // If all selected were skipped, progress is based on selected with visited among non-skipped = 0
    // Spec: visited / (total planned excluding permanently removed)
    // Skipped are not removed permanently — display separately, don't count as visited.
    // Use selected non-skipped as denominator; if none left, 100 if all skipped? Spec says display skipped separately.
    const planned = selected.filter((d) =>
      ['PLANNED', 'CURRENT', 'VISITED'].includes(d.status),
    );
    if (!planned.length) return selected.length ? 100 : 0;
    const visited = planned.filter((d) => d.status === 'VISITED').length;
    return Math.round((visited / planned.length) * 100);
  }
  const visited = countable.filter((d) => d.status === 'VISITED').length;
  return Math.round((visited / countable.length) * 100);
}

/**
 * Mark destination visited.
 */
export async function markDestinationVisited(tripId, userId, destinationId) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  const dest = await prisma.destination.findFirst({
    where: { id: destinationId, tripId },
  });
  if (!dest) {
    const err = new Error('Destination not found');
    err.statusCode = 404;
    throw err;
  }

  await prisma.destination.update({
    where: { id: destinationId },
    data: {
      status: 'VISITED',
      visitedAt: new Date(),
      skippedAt: null,
      skipReason: null,
      selected: true,
    },
  });

  await prisma.tripEvent.create({
    data: {
      tripId,
      userId,
      type: 'DESTINATION_VISITED',
      latitude: dest.latitude,
      longitude: dest.longitude,
      metadata: { destinationId, name: dest.name },
    },
  });

  return refreshTripProgress(tripId, userId);
}

/**
 * Mark destination skipped.
 */
export async function markDestinationSkipped(tripId, userId, destinationId, reason) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  const dest = await prisma.destination.findFirst({
    where: { id: destinationId, tripId },
  });
  if (!dest) {
    const err = new Error('Destination not found');
    err.statusCode = 404;
    throw err;
  }

  await prisma.destination.update({
    where: { id: destinationId },
    data: {
      status: 'SKIPPED',
      skippedAt: new Date(),
      skipReason: reason || null,
      visitedAt: null,
    },
  });

  await prisma.tripEvent.create({
    data: {
      tripId,
      userId,
      type: 'DESTINATION_SKIPPED',
      latitude: dest.latitude,
      longitude: dest.longitude,
      metadata: { destinationId, name: dest.name, reason: reason || null },
    },
  });

  return refreshTripProgress(tripId, userId, { suggestReplan: true });
}

/**
 * Promote next PLANNED selected destination to CURRENT.
 */
async function promoteNextCurrent(tripId, userId) {
  const prisma = getPrisma();
  const current = await prisma.destination.findFirst({
    where: { tripId, status: 'CURRENT' },
  });
  if (current) return;

  const next = await prisma.destination.findFirst({
    where: { tripId, selected: true, status: 'PLANNED' },
    orderBy: { sortOrder: 'asc' },
  });
  if (!next) return;

  await prisma.destination.update({
    where: { id: next.id },
    data: { status: 'CURRENT' },
  });
  await prisma.tripEvent.create({
    data: {
      tripId,
      userId,
      type: 'DESTINATION_CURRENT',
      metadata: { destinationId: next.id, name: next.name },
    },
  });
}

/**
 * Recalculate progress and optionally complete the trip.
 */
export async function refreshTripProgress(tripId, userId, opts = {}) {
  await promoteNextCurrent(tripId, userId);
  const prisma = getPrisma();
  const destinations = await prisma.destination.findMany({ where: { tripId } });
  const progressPercentage = calculateProgress(destinations);

  const selected = destinations.filter((d) => d.selected);
  const remaining = selected.filter((d) =>
    ['PLANNED', 'CURRENT'].includes(d.status),
  );
  const shouldComplete =
    selected.length > 0 && remaining.length === 0 && progressPercentage >= 0;

  const trip = await prisma.trip.update({
    where: { id: tripId },
    data: {
      progressPercentage,
      ...(shouldComplete
        ? {
            status: 'COMPLETED',
            completedAt: new Date(),
            tripEvents: { create: [{ userId, type: 'TRIP_COMPLETED' }] },
          }
        : {}),
    },
    include: {
      preference: true,
      destinations: { orderBy: { sortOrder: 'asc' } },
      bookings: true,
      expenses: true,
      itineraryDays: {
        orderBy: { dayNumber: 'asc' },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  });

  return {
    trip,
    suggestReplan: !!opts.suggestReplan,
  };
}

/**
 * Complete trip manually.
 */
export async function completeTrip(tripId, userId) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  return prisma.trip.update({
    where: { id: tripId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      progressPercentage: 100,
      tripEvents: { create: [{ userId, type: 'TRIP_COMPLETED' }] },
    },
    include: {
      preference: true,
      destinations: { orderBy: { sortOrder: 'asc' } },
      expenses: true,
      itineraryDays: {
        orderBy: { dayNumber: 'asc' },
        include: { items: true },
      },
    },
  });
}
