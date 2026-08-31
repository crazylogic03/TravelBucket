import {
  getRoute,
  searchPlaces,
  reverseGeocodePlace,
  pickPrimaryLocality,
  distanceKm,
  distanceToPolylineKm,
  sampleRoutePointsByDistance,
  routeBoundingBox,
  routeLengthKm,
  isEndpointPlace,
  dedupeByProximity,
  normalizePlaceName,
} from '../places/places.service.js';
import { fetchUnsplashImage } from '../places/unsplash.service.js';

const INTEREST_QUERIES = {
  nature: ['national park', 'waterfall', 'viewpoint', 'wildlife sanctuary'],
  culture: ['temple', 'heritage fort', 'historical monument', 'museum'],
  food: ['food street', 'local cuisine market', 'famous restaurant'],
  adventure: ['adventure sports', 'trekking trail', 'rafting'],
  photography: ['scenic viewpoint', 'sunrise point'],
  relaxation: ['spa resort', 'beach', 'garden'],
  shopping: ['bazaar', 'local market'],
  nightlife: ['nightlife district', 'cafe street'],
};

const DEFAULT_QUERIES = [
  'tourist attraction',
  'temple',
  'viewpoint',
  'heritage site',
  'hill station',
  'lake',
];

function buildSearchQueries(interests = {}) {
  const active = Object.entries(interests)
    .filter(([k, v]) => typeof v === 'boolean' && v && INTEREST_QUERIES[k])
    .flatMap(([k]) => INTEREST_QUERIES[k].slice(0, 2));

  return active.length ? active.slice(0, 6) : DEFAULT_QUERIES.slice(0, 4);
}

function estimateDetourLabel(distanceFromRouteKm, routeFraction) {
  if (distanceFromRouteKm <= 5) return 'On route';
  if (distanceFromRouteKm <= 15) return `~${Math.round(distanceFromRouteKm)} km detour`;
  if (routeFraction != null && routeFraction >= 0.35 && routeFraction <= 0.65) {
    return `~${Math.round(distanceFromRouteKm)} km off route · mid-journey stop`;
  }
  return `~${Math.round(distanceFromRouteKm)} km off route`;
}

function scoreCandidate(place, routeLength) {
  const routeDist = place.distanceFromRouteKm ?? 50;
  const relevance = place.relevance ?? 0.5;
  const typeScore =
    place.placeType === 'district' ? 28 : place.placeType === 'place' ? 16 : place.placeType === 'locality' ? 4 : 0;
  const midBonus =
    place.routeFraction != null &&
    place.routeFraction >= 0.25 &&
    place.routeFraction <= 0.75
      ? 8
      : 0;

  return typeScore + midBonus + relevance * 10 - routeDist * (0.4 + Math.min(routeLength / 800, 1) * 0.15);
}

/**
 * Lightweight route suggestions before full AI discovery.
 * Finds places along the corridor between origin and destination — not at the destination.
 */
export async function getRouteSuggestions({ start, destination, interests = {} }) {
  const route = await getRoute(
    start.longitude,
    start.latitude,
    destination.longitude,
    destination.latitude,
  );

  if (!route?.geometry) {
    return { suggestions: [], route: null };
  }

  const geometry = route.geometry;
  const lengthKm = routeLengthKm(geometry);
  const minEndpointKm = Math.max(12, lengthKm * 0.04);
  const maxOffRouteKm = lengthKm < 120 ? 25 : lengthKm < 400 ? 35 : 45;
  const bbox = routeBoundingBox(geometry);
  const samplePoints = sampleRoutePointsByDistance(geometry, {
    fractions: [0.22, 0.35, 0.48, 0.62, 0.75],
    excludeEnds: 0.1,
  });

  const queries = buildSearchQueries(interests);
  const candidateMap = new Map();

  const addCandidate = (place, extra = {}) => {
    if (place.latitude == null || place.longitude == null) return;

    if (isEndpointPlace(place.name, start.name, destination.name)) return;

    const toStart = distanceKm(start.latitude, start.longitude, place.latitude, place.longitude);
    const toEnd = distanceKm(
      destination.latitude,
      destination.longitude,
      place.latitude,
      place.longitude,
    );
    if (toStart < minEndpointKm || toEnd < minEndpointKm) return;

    const distFromRoute = distanceToPolylineKm(place.latitude, place.longitude, geometry);
    if (distFromRoute > maxOffRouteKm) return;

    const key = `${normalizePlaceName(place.name)}-${place.latitude.toFixed(2)}-${place.longitude.toFixed(2)}`;
    if (candidateMap.has(key)) return;

    const routeFraction = extra.routeFraction ?? null;
    candidateMap.set(key, {
      id: key,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      description: place.fullName || place.description || null,
      reason:
        extra.reason ||
        (place.placeType === 'locality' || place.placeType === 'place'
          ? 'Town along your driving route'
          : 'Worth a stop along your route'),
      detourLabel: extra.detourLabel || estimateDetourLabel(distFromRoute, routeFraction),
      distanceFromRouteKm: Math.round(distFromRoute * 10) / 10,
      routeFraction,
      placeType: place.placeType || null,
      relevance: place.relevance ?? 0.5,
      imageUrl: place.imageUrl || null,
    });
  };

  // 1) Reverse geocode sample points — one primary town/district per point on the corridor
  for (const point of samplePoints) {
    try {
      const localities = await reverseGeocodePlace(point.lat, point.lng);
      const primary = pickPrimaryLocality(localities);
      if (primary) {
        addCandidate(primary, {
          routeFraction: point.routeFraction,
          reason:
            primary.placeType === 'district'
              ? 'Major area along your driving route'
              : 'Town along your driving route',
        });
      }
    } catch {
      /* optional */
    }
  }

  // 2) Interest-based POI search along mid-route (bbox + country constrained)
  for (const point of samplePoints) {
    for (const q of queries.slice(0, 3)) {
      try {
        const found = await searchPlaces({
          query: q,
          proximity: point,
          bbox: bbox?.bboxParam,
          types: 'poi,place',
          limit: 4,
        });
        for (const place of found) {
          addCandidate(place, {
            routeFraction: point.routeFraction,
            reason: `Recommended stop · ${q}`,
          });
        }
      } catch {
        /* optional */
      }
    }
  }

  let suggestions = dedupeByProximity(
    [...candidateMap.values()],
    10,
    (p) => scoreCandidate(p, lengthKm),
  )
    .sort((a, b) => scoreCandidate(b, lengthKm) - scoreCandidate(a, lengthKm))
    .slice(0, 6);

  for (const s of suggestions) {
    if (s.imageUrl) continue;
    try {
      s.imageUrl = await fetchUnsplashImage(`${s.name} travel India`);
    } catch {
      s.imageUrl = null;
    }
  }

  return {
    suggestions,
    route: {
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      geometry: route.geometry,
    },
  };
}

/**
 * Persist accepted route stops onto a trip as selected destinations.
 */
export async function addRouteStopsToTrip(tripId, userId, stops, prisma, getOwnedTripFn) {
  await getOwnedTripFn(tripId, userId);

  const existing = await prisma.destination.findMany({ where: { tripId } });
  let sortOrder = existing.length + 1;
  const created = [];

  for (const stop of stops) {
    const dup = existing.find((d) => d.name.toLowerCase() === stop.name.toLowerCase());
    if (dup) {
      if (!dup.selected) {
        await prisma.destination.update({
          where: { id: dup.id },
          data: { selected: true, status: 'PLANNED' },
        });
      }
      continue;
    }

    const row = await prisma.destination.create({
      data: {
        tripId,
        name: stop.name,
        description: stop.description || stop.reason || null,
        latitude: stop.latitude,
        longitude: stop.longitude,
        recommendationReason: stop.reason || 'Added from route suggestions',
        imageUrl: stop.imageUrl || null,
        recommendedDurationMinutes: 480,
        estimatedCost: 1500,
        routeRelevanceScore: 0.85,
        preferenceMatchScore: 0.7,
        status: 'PLANNED',
        sortOrder: sortOrder++,
        selected: true,
      },
    });
    created.push(row);
  }

  return created;
}
