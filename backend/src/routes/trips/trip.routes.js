import { requireAuth } from '../../middleware/auth.middleware.js';
import {
  listTripsForUser,
  createDraftTrip,
  updateTripBasics,
  updateTripTransport,
  confirmBooking,
  getOwnedTrip,
  getLatestDraft,
  inferWizardStep,
} from '../../services/trips/trip.service.js';
import {
  tripBasicsSchema,
  transportSchema,
  bookingConfirmSchema,
  stayPreferenceSchema,
} from '../../validators/trip.validators.js';
import { getPrisma } from '../../db/prisma.js';

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
    bookings: trip.bookings?.map((b) => ({
      ...b,
      amount: b.amount != null ? Number(b.amount) : null,
    })),
    destinations: trip.destinations?.map((d) => ({
      ...d,
      estimatedCost: d.estimatedCost != null ? Number(d.estimatedCost) : null,
    })),
    expenses: trip.expenses?.map((e) => ({
      ...e,
      amount: Number(e.amount),
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
    wizardStep: inferWizardStep(trip),
  };
}

/** @param {import('fastify').FastifyInstance} app */
export default async function tripRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/trips', async (request) => {
    const trips = await listTripsForUser(request.user.id);
    return { trips: trips.map(serializeTrip) };
  });

  app.get('/trips/draft', async (request) => {
    const draft = await getLatestDraft(request.user.id);
    return {
      draft: draft ? serializeTrip(draft) : null,
      continuePath: draft ? `/trips/new/${inferWizardStep(draft)}?tripId=${draft.id}` : null,
    };
  });

  app.get('/trips/:tripId', async (request) => {
    const trip = await getOwnedTrip(request.params.tripId, request.user.id);
    return { trip: serializeTrip(trip) };
  });

  app.post('/trips', async (request, reply) => {
    const parsed = tripBasicsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    if (new Date(parsed.data.endDate) < new Date(parsed.data.startDate)) {
      return reply.status(400).send({ error: 'End date must be on or after start date' });
    }
    const trip = await createDraftTrip(request.user.id, parsed.data);
    return reply.status(201).send({ trip: serializeTrip(trip) });
  });

  app.patch('/trips/:tripId/basics', async (request, reply) => {
    const parsed = tripBasicsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    if (new Date(parsed.data.endDate) < new Date(parsed.data.startDate)) {
      return reply.status(400).send({ error: 'End date must be on or after start date' });
    }
    const trip = await updateTripBasics(request.params.tripId, request.user.id, parsed.data);
    return { trip: serializeTrip(trip) };
  });

  app.patch('/trips/:tripId/transport', async (request, reply) => {
    const parsed = transportSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const trip = await updateTripTransport(request.params.tripId, request.user.id, parsed.data);
    return { trip: serializeTrip(trip) };
  });

  app.post('/trips/:tripId/bookings', async (request, reply) => {
    const parsed = bookingConfirmSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const booking = await confirmBooking(request.params.tripId, request.user.id, parsed.data);
    return reply.status(201).send({
      booking: {
        ...booking,
        amount: booking.amount != null ? Number(booking.amount) : null,
      },
    });
  });

  app.post('/trips/:tripId/stay', async (request, reply) => {
    const parsed = stayPreferenceSchema.safeParse(request.body || {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
    }
    const trip = await getOwnedTrip(request.params.tripId, request.user.id);
    const prisma = getPrisma();
    await prisma.tripEvent.create({
      data: {
        tripId: trip.id,
        userId: request.user.id,
        type: 'TRIP_CREATED',
        metadata: {
          step: 'stay',
          tier: parsed.data.tier || null,
          skipped: !!parsed.data.skip,
        },
      },
    });
    return { trip: serializeTrip(await getOwnedTrip(trip.id, request.user.id)), next: 'discover' };
  });
}
