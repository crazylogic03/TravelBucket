import { getPrisma } from '../../db/prisma.js';

/**
 * Compute number of days between two date strings (inclusive).
 * @param {string} startDate
 * @param {string} endDate
 */
export function computeNumberOfDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

/**
 * Default title from start → destination.
 */
export function defaultTripTitle(startLocationName, destinationName) {
  return `${startLocationName} → ${destinationName}`;
}

/**
 * Ensure the trip belongs to the user.
 * @param {string} tripId
 * @param {string} userId
 */
export async function getOwnedTrip(tripId, userId) {
  const prisma = getPrisma();
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
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
  if (!trip) {
    const err = new Error('Trip not found');
    err.statusCode = 404;
    throw err;
  }
  return trip;
}

/**
 * List trips for a user grouped-friendly.
 * @param {string} userId
 */
export async function listTripsForUser(userId) {
  const prisma = getPrisma();
  return prisma.trip.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      preference: true,
      destinations: {
        where: { selected: true },
        take: 1,
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { destinations: true, expenses: true } },
    },
  });
}

/**
 * Create a draft trip from basics.
 * @param {string} userId
 * @param {object} data
 */
export async function createDraftTrip(userId, data) {
  const prisma = getPrisma();
  const numberOfDays = computeNumberOfDays(data.startDate, data.endDate);
  const title = data.title || defaultTripTitle(data.startLocationName, data.destinationName);
  const interests = data.interests || {};

  return prisma.trip.create({
    data: {
      userId,
      title,
      startLocationName: data.startLocationName,
      startLatitude: data.startLatitude,
      startLongitude: data.startLongitude,
      destinationName: data.destinationName,
      destinationLatitude: data.destinationLatitude,
      destinationLongitude: data.destinationLongitude,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      numberOfDays,
      travelerCount: data.travelerCount,
      budgetAmount: data.budgetAmount,
      currency: data.currency || 'INR',
      status: 'DRAFT',
      preference: {
        create: {
          nature: !!interests.nature,
          culture: !!interests.culture,
          food: !!interests.food,
          adventure: !!interests.adventure,
          photography: !!interests.photography,
          relaxation: !!interests.relaxation,
          shopping: !!interests.shopping,
          nightlife: !!interests.nightlife,
        },
      },
      tripEvents: {
        create: [{ userId, type: 'TRIP_CREATED' }],
      },
    },
    include: { preference: true },
  });
}

/**
 * Update trip basics on an existing draft/planned trip.
 */
export async function updateTripBasics(tripId, userId, data) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  const numberOfDays = computeNumberOfDays(data.startDate, data.endDate);
  const title = data.title || defaultTripTitle(data.startLocationName, data.destinationName);
  const interests = data.interests || {};

  return prisma.trip.update({
    where: { id: tripId },
    data: {
      title,
      startLocationName: data.startLocationName,
      startLatitude: data.startLatitude,
      startLongitude: data.startLongitude,
      destinationName: data.destinationName,
      destinationLatitude: data.destinationLatitude,
      destinationLongitude: data.destinationLongitude,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      numberOfDays,
      travelerCount: data.travelerCount,
      budgetAmount: data.budgetAmount,
      currency: data.currency || 'INR',
      preference: {
        upsert: {
          create: {
            nature: !!interests.nature,
            culture: !!interests.culture,
            food: !!interests.food,
            adventure: !!interests.adventure,
            photography: !!interests.photography,
            relaxation: !!interests.relaxation,
            shopping: !!interests.shopping,
            nightlife: !!interests.nightlife,
          },
          update: {
            nature: !!interests.nature,
            culture: !!interests.culture,
            food: !!interests.food,
            adventure: !!interests.adventure,
            photography: !!interests.photography,
            relaxation: !!interests.relaxation,
            shopping: !!interests.shopping,
            nightlife: !!interests.nightlife,
          },
        },
      },
    },
    include: { preference: true },
  });
}

/**
 * Update transport mode and optional vehicle metadata via a booking/metadata event.
 */
export async function updateTripTransport(tripId, userId, data) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();

  return prisma.trip.update({
    where: { id: tripId },
    data: {
      transportMode: data.transportMode,
      tripEvents: {
        create: [
          {
            userId,
            type: 'TRIP_CREATED',
            metadata: {
              step: 'transport',
              transportMode: data.transportMode,
              vehicleDetails: data.vehicleDetails || null,
            },
          },
        ],
      },
    },
    include: { preference: true, bookings: true },
  });
}

/**
 * Confirm a user-reported booking.
 */
export async function confirmBooking(tripId, userId, data) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();

  return prisma.booking.create({
    data: {
      tripId,
      userId,
      type: data.type,
      provider: data.provider,
      title: data.title,
      departureLocation: data.departureLocation || null,
      arrivalLocation: data.arrivalLocation || null,
      departureAt: data.departureAt ? new Date(data.departureAt) : null,
      arrivalAt: data.arrivalAt ? new Date(data.arrivalAt) : null,
      amount: data.amount ?? null,
      currency: data.currency || 'INR',
      status: data.status || 'CONFIRMED',
      bookingUrl: data.bookingUrl || null,
      externalReference: data.externalReference || null,
    },
  });
}

/**
 * Get the latest incomplete draft for continue-planning.
 */
export async function getLatestDraft(userId) {
  const prisma = getPrisma();
  return prisma.trip.findFirst({
    where: { userId, status: 'DRAFT' },
    orderBy: { updatedAt: 'desc' },
    include: {
      preference: true,
      bookings: true,
      destinations: true,
      itineraryDays: { include: { items: true } },
    },
  });
}

/**
 * Infer wizard step from trip state.
 * @param {object} trip
 * @returns {string}
 */
export function inferWizardStep(trip) {
  if (!trip) return 'basics';
  if (!trip.startLocationName || !trip.destinationName) return 'basics';
  if (!trip.transportMode) return 'transport';

  const destinations = trip.destinations || [];
  const selected = destinations.filter((d) => d.selected);
  const hasItinerary = (trip.itineraryDays || []).length > 0;

  if (trip.status === 'DRAFT' && hasItinerary) return 'review';
  if (selected.length > 0 && !hasItinerary) return 'optimize';
  if (destinations.length > 0 && selected.length === 0) return 'select';
  if (destinations.length > 0) return 'discover';

  return 'discover';
}
