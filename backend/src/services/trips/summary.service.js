import { getPrisma } from '../../db/prisma.js';
import { getOwnedTrip } from '../trips/trip.service.js';
import { runTripSummaryAgent } from '../../ai/agents/tripSummary.agent.js';
import { completeTrip } from './liveTrip.service.js';

/**
 * Build trip summary (does not require COMPLETED status).
 */
export async function getTripSummary(tripId, userId) {
  const trip = await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();

  const [destinations, expenses, events] = await Promise.all([
    prisma.destination.findMany({ where: { tripId }, orderBy: { sortOrder: 'asc' } }),
    prisma.expense.findMany({ where: { tripId }, orderBy: { expenseDate: 'asc' } }),
    prisma.tripEvent.findMany({ where: { tripId }, orderBy: { timestamp: 'asc' }, take: 100 }),
  ]);

  const { summary, stats, meta } = await runTripSummaryAgent({
    trip,
    destinations,
    expenses,
    events,
    userId,
  });

  return { summary, stats, trip: { id: trip.id, title: trip.title, status: trip.status }, meta };
}

/**
 * Complete trip and return summary in one call.
 */
export async function completeTripWithSummary(tripId, userId) {
  await completeTrip(tripId, userId);
  return getTripSummary(tripId, userId);
}
