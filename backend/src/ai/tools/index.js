import { getPrisma } from '../../db/prisma.js';
import { getOwnedTrip } from '../../services/trips/trip.service.js';
import { getWeather } from '../../services/weather/weather.service.js';
import { getRoute, searchPlaces, distanceKm } from '../../services/places/places.service.js';
import { calculateBudgetStatus } from '../../services/expenses/expense.calculator.js';
import { calculateProgress } from '../../services/trips/liveTrip.service.js';

export const toolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'get_current_trip',
      description: 'Get the current trip summary',
      parameters: {
        type: 'object',
        properties: { tripId: { type: 'string' } },
        required: ['tripId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_trip_itinerary',
      description: 'Get day-by-day itinerary for a trip',
      parameters: {
        type: 'object',
        properties: { tripId: { type: 'string' } },
        required: ['tripId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather for coordinates',
      parameters: {
        type: 'object',
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' },
        },
        required: ['latitude', 'longitude'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_nearby_places',
      description: 'Search places near a location',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
        },
        required: ['query', 'latitude', 'longitude'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_restaurants',
      description: 'Search restaurants near a location',
      parameters: {
        type: 'object',
        properties: {
          latitude: { type: 'number' },
          longitude: { type: 'number' },
        },
        required: ['latitude', 'longitude'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_distance',
      description: 'Calculate distance in km between two coordinates',
      parameters: {
        type: 'object',
        properties: {
          fromLat: { type: 'number' },
          fromLng: { type: 'number' },
          toLat: { type: 'number' },
          toLng: { type: 'number' },
        },
        required: ['fromLat', 'fromLng', 'toLat', 'toLng'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_route',
      description: 'Get driving route distance and duration between two points',
      parameters: {
        type: 'object',
        properties: {
          fromLng: { type: 'number' },
          fromLat: { type: 'number' },
          toLng: { type: 'number' },
          toLat: { type: 'number' },
        },
        required: ['fromLng', 'fromLat', 'toLng', 'toLat'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_eta',
      description: 'Get ETA in minutes between two coordinates via driving route',
      parameters: {
        type: 'object',
        properties: {
          fromLng: { type: 'number' },
          fromLat: { type: 'number' },
          toLng: { type: 'number' },
          toLat: { type: 'number' },
        },
        required: ['fromLng', 'fromLat', 'toLng', 'toLat'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_remaining_destinations',
      description: 'List remaining planned destinations for a trip',
      parameters: {
        type: 'object',
        properties: { tripId: { type: 'string' } },
        required: ['tripId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_trip_expenses',
      description: 'List trip expenses and totals',
      parameters: {
        type: 'object',
        properties: { tripId: { type: 'string' } },
        required: ['tripId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_budget_status',
      description: 'Calculate budget status with projections',
      parameters: {
        type: 'object',
        properties: { tripId: { type: 'string' } },
        required: ['tripId'],
      },
    },
  },
];

/**
 * @param {string} name
 * @param {object} args
 * @param {{ userId: string, tripId?: string, location?: { latitude: number, longitude: number } }} ctx
 */
export async function executeTool(name, args, ctx) {
  const prisma = getPrisma();
  const tripId = args.tripId || ctx.tripId;

  switch (name) {
    case 'get_current_trip': {
      const trip = await prisma.trip.findFirst({
        where: { id: tripId, userId: ctx.userId },
        include: { preference: true, destinations: true },
      });
      if (!trip) return { error: 'Trip not found' };
      return {
        id: trip.id,
        title: trip.title,
        status: trip.status,
        start: trip.startLocationName,
        destination: trip.destinationName,
        budgetAmount: Number(trip.budgetAmount),
        currency: trip.currency,
        transportMode: trip.transportMode,
        progressPercentage: calculateProgress(trip.destinations || []),
      };
    }
    case 'get_trip_itinerary': {
      const days = await prisma.itineraryDay.findMany({
        where: { tripId, trip: { userId: ctx.userId } },
        orderBy: { dayNumber: 'asc' },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
      return { days };
    }
    case 'get_weather':
      try {
        return await getWeather(args.latitude, args.longitude);
      } catch {
        return { error: 'Weather unavailable' };
      }
    case 'search_nearby_places':
      try {
        return await searchPlaces({
          query: args.query,
          proximity: { lat: args.latitude, lng: args.longitude },
          limit: 8,
        });
      } catch {
        return { error: 'Places search unavailable', results: [] };
      }
    case 'search_restaurants':
      try {
        const results = await searchPlaces({
          query: 'restaurant',
          proximity: { lat: args.latitude, lng: args.longitude },
          limit: 8,
        });
        return { restaurants: results };
      } catch {
        return { error: 'Restaurant search unavailable', restaurants: [] };
      }
    case 'calculate_distance':
      return {
        distanceKm: Math.round(
          distanceKm(args.fromLat, args.fromLng, args.toLat, args.toLng) * 10,
        ) / 10,
      };
    case 'get_route':
      try {
        return await getRoute(args.fromLng, args.fromLat, args.toLng, args.toLat);
      } catch {
        return { error: 'Route unavailable' };
      }
    case 'get_eta': {
      try {
        const route = await getRoute(args.fromLng, args.fromLat, args.toLng, args.toLat);
        if (!route) return { error: 'No route found' };
        return {
          durationMinutes: Math.round(route.durationSeconds / 60),
          distanceKm: Math.round((route.distanceMeters / 1000) * 10) / 10,
        };
      } catch {
        return { error: 'ETA unavailable' };
      }
    }
    case 'get_remaining_destinations': {
      const destinations = await prisma.destination.findMany({
        where: {
          tripId,
          selected: true,
          status: { in: ['PLANNED', 'CURRENT'] },
          trip: { userId: ctx.userId },
        },
        orderBy: { sortOrder: 'asc' },
      });
      return { destinations };
    }
    case 'get_trip_expenses': {
      const trip = await getOwnedTrip(tripId, ctx.userId);
      const expenses = await prisma.expense.findMany({
        where: { tripId },
        orderBy: { expenseDate: 'desc' },
      });
      return {
        expenses: expenses.map((e) => ({ ...e, amount: Number(e.amount) })),
        totalSpent: expenses.reduce((s, e) => s + Number(e.amount), 0),
        currency: trip.currency,
      };
    }
    case 'calculate_budget_status': {
      const trip = await getOwnedTrip(tripId, ctx.userId);
      const expenses = await prisma.expense.findMany({ where: { tripId } });
      return calculateBudgetStatus({ ...trip, expenses });
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
