import { getOwnedTrip } from '../trips/trip.service.js';
import { getWeather } from '../weather/weather.service.js';
import { runTripOptimizerAgent } from '../../ai/agents/tripOptimizer.agent.js';
import { getPrisma } from '../../db/prisma.js';
import { formatDuration } from './travelTime.service.js';

/**
 * Optimize itinerary and persist days/items.
 * Persists travelLeg as dayNumber 0 (separate from destination days 1..N).
 */
export async function runOptimization(tripId, userId, opts = {}) {
  const trip = await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();

  const where = { tripId, selected: true };
  if (opts.onlyRemaining) {
    where.status = { in: ['PLANNED', 'CURRENT'] };
  }

  const destinations = await prisma.destination.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });

  if (!destinations.length) {
    const err = new Error('Select at least one destination before optimizing');
    err.statusCode = 400;
    throw err;
  }

  /** @type {Record<string, object>} */
  const weatherByDest = {};
  for (const d of destinations.slice(0, 5)) {
    try {
      weatherByDest[d.id] = await getWeather(d.latitude, d.longitude);
    } catch {
      weatherByDest[d.id] = null;
    }
  }

  const { plan, meta } = await runTripOptimizerAgent({
    trip,
    destinations,
    weatherByDest,
    userId,
  });

  // Replace itinerary
  await prisma.itineraryItem.deleteMany({
    where: { itineraryDay: { tripId } },
  });
  await prisma.itineraryDay.deleteMany({ where: { tripId } });

  const destByName = new Map(destinations.map((d) => [d.name.toLowerCase(), d]));
  const startDate = new Date(trip.startDate);

  // Persist separate travel leg as day 0 (does not count as a destination day)
  if (plan.travelLeg) {
    const travelDate = new Date(startDate);
    if (plan.travelLeg.overnight) {
      travelDate.setDate(startDate.getDate() - 1);
    }
    const travelDay = await prisma.itineraryDay.create({
      data: {
        tripId,
        dayNumber: 0,
        date: travelDate,
        title: plan.travelLeg.title || 'Travel leg',
        notes:
          plan.travelLeg.description ||
          `Separate transportation timeline · ${formatDuration(plan.travelLeg.durationMinutes || 0)}`,
        estimatedCost: 0,
      },
    });

    const travelItems = plan.travelLeg.items?.length
      ? plan.travelLeg.items
      : [
          {
            type: 'TRANSPORT',
            title: plan.travelLeg.title,
            description: plan.travelLeg.description,
            startTime: plan.travelLeg.departTime,
            endTime: plan.travelLeg.arriveTime,
            durationMinutes: plan.travelLeg.durationMinutes,
            estimatedCost: 0,
          },
        ];

    let sortOrder = 1;
    for (const item of travelItems) {
      await prisma.itineraryItem.create({
        data: {
          itineraryDayId: travelDay.id,
          type: item.type || 'TRANSPORT',
          title: item.title,
          description: item.description || null,
          startTime: item.startTime || null,
          endTime: item.endTime || null,
          durationMinutes: item.durationMinutes || null,
          estimatedCost: item.estimatedCost ?? null,
          sortOrder: sortOrder++,
        },
      });
    }
  }

  for (const day of plan.days) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + (day.dayNumber - 1));

    const createdDay = await prisma.itineraryDay.create({
      data: {
        tripId,
        dayNumber: day.dayNumber,
        date,
        title: day.title || `Day ${day.dayNumber}`,
        notes: day.notes || null,
        estimatedCost: day.estimatedCost ?? null,
      },
    });

    let sortOrder = 1;
    for (const item of day.items || []) {
      const dest = item.destinationName
        ? destByName.get(String(item.destinationName).toLowerCase())
        : null;
      await prisma.itineraryItem.create({
        data: {
          itineraryDayId: createdDay.id,
          destinationId: dest?.id || null,
          type: item.type || 'ACTIVITY',
          title: item.title,
          description: item.description || null,
          startTime: item.startTime || null,
          endTime: item.endTime || null,
          durationMinutes: item.durationMinutes || null,
          latitude: dest?.latitude ?? null,
          longitude: dest?.longitude ?? null,
          estimatedCost: item.estimatedCost ?? null,
          sortOrder: sortOrder++,
        },
      });
    }
  }

  const updated = await getOwnedTrip(tripId, userId);

  return {
    trip: updated,
    score: plan.score,
    whyThisPlan: plan.whyThisPlan,
    travelLeg: plan.travelLeg || null,
    meta,
  };
}

/**
 * Finalize trip: DRAFT -> PLANNED
 */
export async function finalizeTrip(tripId, userId) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();

  const days = await prisma.itineraryDay.count({
    where: { tripId, dayNumber: { gt: 0 } },
  });
  if (!days) {
    const err = new Error('Optimize the trip before accepting it');
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: 'PLANNED',
      tripEvents: {
        create: [{ userId, type: 'TRIP_PLANNED' }],
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

  return updated;
}
