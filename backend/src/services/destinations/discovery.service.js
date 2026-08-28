import { getOwnedTrip } from '../trips/trip.service.js';
import {
  getRoute,
  searchPlaces,
  reverseGeocodePlace,
  pickPrimaryLocality,
  sampleRoutePointsByDistance,
  routeBoundingBox,
  routeLengthKm,
  distanceKm,
  distanceToPolylineKm,
  isEndpointPlace,
  dedupeByProximity,
} from '../places/places.service.js';
import { fetchUnsplashImage } from '../places/unsplash.service.js';
import { runTravelDiscoveryAgent } from '../../ai/agents/travelDiscovery.agent.js';
import { getPrisma } from '../../db/prisma.js';

const INTEREST_QUERIES = {
  nature: ['national park', 'waterfall', 'lake', 'viewpoint'],
  culture: ['temple', 'museum', 'fort', 'heritage'],
  food: ['food market', 'local cuisine', 'restaurant street'],
  adventure: ['trekking', 'adventure sports', 'rafting'],
  photography: ['scenic viewpoint', 'sunrise point'],
  relaxation: ['spa', 'beach', 'garden'],
  shopping: ['market', 'bazaar'],
  nightlife: ['nightlife', 'cafe street'],
};

function scoreDiscoveryCandidate(c) {
  const routeDist = c.distanceFromRouteKm ?? 50;
  const typeScore =
    c.placeType === 'district' ? 20 : c.placeType === 'place' ? 12 : c.placeType === 'locality' ? 3 : 0;
  const midBonus =
    c.routeFraction != null && c.routeFraction >= 0.25 && c.routeFraction <= 0.75 ? 5 : 0;
  return typeScore + midBonus + (c.relevance ?? 0.5) * 8 - routeDist * 0.5;
}

/**
 * Collect candidate places along a route corridor (not at destination).
 */
async function collectRouteCandidates({ trip, route, queries }) {
  const geometry = route.geometry;
  const lengthKm = routeLengthKm(geometry);
  const minEndpointKm = Math.max(10, lengthKm * 0.04);
  const bbox = routeBoundingBox(geometry);
  const samplePoints = sampleRoutePointsByDistance(geometry, {
    fractions: [0.2, 0.32, 0.45, 0.58, 0.7, 0.82],
    excludeEnds: 0.08,
  });

  /** @type {Map<string, object>} */
  const candidateMap = new Map();

  const addCandidate = (place, extra = {}) => {
    if (!place.latitude || !place.longitude) return;
    if (isEndpointPlace(place.name, trip.startLocationName, trip.destinationName)) return;

    const toStart = distanceKm(
      trip.startLatitude,
      trip.startLongitude,
      place.latitude,
      place.longitude,
    );
    const toEnd = distanceKm(
      trip.destinationLatitude,
      trip.destinationLongitude,
      place.latitude,
      place.longitude,
    );
    if (toStart < minEndpointKm || toEnd < minEndpointKm) return;

    const distFromRoute = distanceToPolylineKm(place.latitude, place.longitude, geometry);
    const maxOffRoute =
      trip.transportMode === 'BIKE' || trip.transportMode === 'CAR' ? 40 : 30;
    if (distFromRoute > maxOffRoute) return;

    const key = `${place.name.toLowerCase()}-${place.latitude.toFixed(3)}-${place.longitude.toFixed(3)}`;
    if (candidateMap.has(key)) return;

    candidateMap.set(key, {
      ...place,
      distanceFromRouteKm: Math.round(distFromRoute * 10) / 10,
      routeFraction: extra.routeFraction ?? null,
    });
  };

  for (const point of samplePoints) {
    try {
      const localities = await reverseGeocodePlace(point.lat, point.lng);
      const primary = pickPrimaryLocality(localities);
      if (primary) {
        addCandidate(primary, { routeFraction: point.routeFraction });
      }
    } catch {
      /* continue */
    }
  }

  for (const point of samplePoints) {
    for (const q of queries.slice(0, 4)) {
      try {
        const found = await searchPlaces({
          query: q,
          proximity: point,
          bbox: bbox?.bboxParam,
          types: 'poi,place,locality',
          limit: 5,
        });
        for (const place of found) {
          addCandidate(place, { routeFraction: point.routeFraction });
        }
      } catch {
        /* continue */
      }
    }
  }

  return dedupeByProximity([...candidateMap.values()], 8, scoreDiscoveryCandidate);
}

/**
 * Run discovery pipeline with real stages.
 * @param {string} tripId
 * @param {string} userId
 * @param {(stage: string) => void} [onStage]
 */
export async function runDiscoveryPipeline(tripId, userId, onStage = () => {}) {
  const trip = await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();

  onStage('mapping_route');
  const route = await getRoute(
    trip.startLongitude,
    trip.startLatitude,
    trip.destinationLongitude,
    trip.destinationLatitude,
  );

  if (!route?.geometry) {
    const err = new Error('Could not calculate route for discovery');
    err.statusCode = 422;
    throw err;
  }

  onStage('finding_stops');
  const preference = trip.preference || {};
  const activeInterests = Object.entries(preference)
    .filter(([k, v]) => typeof v === 'boolean' && v && INTEREST_QUERIES[k])
    .map(([k]) => k);

  const queries = activeInterests.length
    ? activeInterests.flatMap((k) => INTEREST_QUERIES[k].slice(0, 2))
    : ['tourist attraction', 'viewpoint', 'temple', 'market', 'lake'];

  let candidates = await collectRouteCandidates({ trip, route, queries });

  onStage('checking_feasibility');
  const maxOffRoute =
    trip.transportMode === 'BIKE' || trip.transportMode === 'CAR' ? 40 : 25;
  candidates = candidates.filter((c) => c.distanceFromRouteKm <= maxOffRoute);
  candidates.sort((a, b) => scoreDiscoveryCandidate(b) - scoreDiscoveryCandidate(a));
  candidates = candidates.slice(0, 40);

  if (candidates.length < 3) {
    // Expand mid-route corridor search — never seed destination-area attractions
    const midPoints = sampleRoutePointsByDistance(route.geometry, {
      fractions: [0.35, 0.5, 0.65],
      excludeEnds: 0.12,
    });
    const bbox = routeBoundingBox(route.geometry);
    const extraQueries = ['tourist destination', 'heritage site', 'viewpoint', 'town'];

    for (const point of midPoints) {
      for (const q of extraQueries) {
        try {
          const found = await searchPlaces({
            query: q,
            proximity: point,
            bbox: bbox?.bboxParam,
            limit: 5,
          });
          for (const place of found) {
            if (!place.latitude || isEndpointPlace(place.name, trip.startLocationName, trip.destinationName)) {
              continue;
            }
            const distFromRoute = distanceToPolylineKm(
              place.latitude,
              place.longitude,
              route.geometry,
            );
            if (distFromRoute > maxOffRoute) continue;
            const key = `${place.name.toLowerCase()}-${place.latitude.toFixed(3)}`;
            if (candidates.some((c) => c.name.toLowerCase() === place.name.toLowerCase())) continue;
            candidates.push({
              ...place,
              distanceFromRouteKm: Math.round(distFromRoute * 10) / 10,
              routeFraction: point.routeFraction,
            });
          }
        } catch {
          /* ignore */
        }
      }
    }

    candidates = dedupeByProximity(candidates, 8, scoreDiscoveryCandidate).slice(0, 40);
  }

  onStage('ranking_experiences');
  const ranked = await runTravelDiscoveryAgent({
    trip,
    candidates: candidates.slice(0, 40),
    userId,
  });

  onStage('saving_candidates');
  await prisma.destination.deleteMany({
    where: { tripId, selected: false },
  });

  const existingSelected = await prisma.destination.findMany({
    where: { tripId, selected: true },
  });
  const selectedNames = new Set(existingSelected.map((d) => d.name.toLowerCase()));

  const toCreate = [];
  let sortOrder = existingSelected.length + 1;

  for (const c of ranked.candidates.slice(0, 30)) {
    if (selectedNames.has(c.name.toLowerCase())) continue;
    let imageUrl = null;
    try {
      imageUrl = await fetchUnsplashImage(`${c.name} travel`);
    } catch {
      imageUrl = null;
    }

    toCreate.push({
      tripId,
      name: c.name,
      description: c.description,
      famousFor: c.famousFor || null,
      bestTime: c.bestTime || null,
      latitude: c.latitude,
      longitude: c.longitude,
      recommendedDurationMinutes: c.recommendedDurationMinutes || 90,
      estimatedCost: c.estimatedCost ?? 500,
      routeRelevanceScore: c.routeRelevanceScore,
      preferenceMatchScore: c.preferenceMatchScore,
      recommendationReason: c.recommendationReason,
      imageUrl,
      status: 'PLANNED',
      sortOrder: sortOrder++,
      selected: false,
    });
  }

  if (toCreate.length) {
    await prisma.destination.createMany({ data: toCreate });
  }

  const destinations = await prisma.destination.findMany({
    where: { tripId },
    orderBy: [{ selected: 'desc' }, { sortOrder: 'asc' }],
  });

  return {
    stage: 'complete',
    summary: ranked.summary,
    route: {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
    },
    candidates: destinations.map(serializeDestination),
    meta: ranked.meta,
  };
}

export function serializeDestination(d) {
  return {
    ...d,
    estimatedCost: d.estimatedCost != null ? Number(d.estimatedCost) : null,
  };
}

/**
 * Toggle destination selection.
 */
export async function setDestinationSelection(tripId, userId, destinationId, selected) {
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
  return prisma.destination.update({
    where: { id: destinationId },
    data: { selected: !!selected },
  });
}

/**
 * Reorder selected destinations.
 * @param {string[]} orderedIds
 */
export async function reorderDestinations(tripId, userId, orderedIds) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.destination.updateMany({
        where: { id, tripId },
        data: { sortOrder: index + 1 },
      }),
    ),
  );
  return prisma.destination.findMany({
    where: { tripId },
    orderBy: { sortOrder: 'asc' },
  });
}
