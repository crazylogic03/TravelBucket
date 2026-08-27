import { config } from '../../config/env.js';

const TIMEOUT_MS = 10000;

/**
 * @param {string} path
 * @param {Record<string, string>} params
 */
async function mapboxFetch(path, params = {}) {
  if (!config.mapboxAccessToken) {
    const err = new Error('Mapbox is not configured');
    err.statusCode = 503;
    throw err;
  }

  const url = new URL(`https://api.mapbox.com${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('access_token', config.mapboxAccessToken);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      const err = new Error('Places search failed');
      err.statusCode = 502;
      throw err;
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Haversine distance in km.
 */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Distance from a point to a line segment (lat/lng), in km.
 */
export function distanceToSegmentKm(lat, lng, lat1, lng1, lat2, lng2) {
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  if (dx === 0 && dy === 0) return distanceKm(lat, lng, lat1, lng1);
  const t = Math.max(0, Math.min(1, ((lng - lng1) * dx + (lat - lat1) * dy) / (dx * dx + dy * dy)));
  const projLat = lat1 + t * dy;
  const projLng = lng1 + t * dx;
  return distanceKm(lat, lng, projLat, projLng);
}

/**
 * True perpendicular-ish distance from a point to a route polyline, in km.
 * @param {{ type?: string, coordinates?: number[][] }} geometry
 */
export function distanceToPolylineKm(lat, lng, geometry) {
  const coords = geometry?.coordinates || [];
  if (coords.length === 0) return Infinity;
  if (coords.length === 1) {
    const [cLng, cLat] = coords[0];
    return distanceKm(lat, lng, cLat, cLng);
  }
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    min = Math.min(min, distanceToSegmentKm(lat, lng, lat1, lng1, lat2, lng2));
  }
  return min;
}

/**
 * Total route length in km from a GeoJSON LineString.
 */
export function routeLengthKm(geometry) {
  const coords = geometry?.coordinates || [];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    total += distanceKm(lat1, lng1, lat2, lng2);
  }
  return total;
}

/**
 * Sample points along a route by fraction of total distance (excludes endpoint zones).
 * @param {{ coordinates?: number[][] }} geometry
 * @param {{ fractions?: number[], excludeEnds?: number }} [opts]
 */
export function sampleRoutePointsByDistance(
  geometry,
  { fractions = [0.25, 0.4, 0.55, 0.7], excludeEnds = 0.12 } = {},
) {
  const coords = geometry?.coordinates || [];
  if (coords.length < 2) return [];

  const cumDist = [0];
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    cumDist.push(cumDist[i - 1] + distanceKm(lat1, lng1, lat2, lng2));
  }

  const total = cumDist[cumDist.length - 1];
  if (total <= 0) return [];

  const points = [];
  for (const frac of fractions) {
    if (frac <= excludeEnds || frac >= 1 - excludeEnds) continue;
    const target = total * frac;
    let idx = cumDist.findIndex((d) => d >= target);
    if (idx <= 0) idx = 1;
    const segStart = cumDist[idx - 1];
    const segLen = cumDist[idx] - segStart;
    const t = segLen > 0 ? (target - segStart) / segLen : 0;
    const [lng1, lat1] = coords[idx - 1];
    const [lng2, lat2] = coords[idx];
    points.push({
      lat: lat1 + t * (lat2 - lat1),
      lng: lng1 + t * (lng2 - lng1),
      routeFraction: frac,
    });
  }
  return points;
}

/**
 * Bounding box for a route with optional padding (degrees).
 * @param {{ coordinates?: number[][] }} geometry
 * @param {number} [paddingDeg]
 */
export function routeBoundingBox(geometry, paddingDeg = 0.35) {
  const coords = geometry?.coordinates || [];
  if (!coords.length) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  const west = minLng - paddingDeg;
  const south = minLat - paddingDeg;
  const east = maxLng + paddingDeg;
  const north = maxLat + paddingDeg;

  return {
    minLng: west,
    minLat: south,
    maxLng: east,
    maxLat: north,
    bboxParam: `${west},${south},${east},${north}`,
  };
}

/**
 * Search places using Mapbox geocoding.
 * @param {{ query: string, proximity?: { lat: number, lng: number }, bbox?: string, limit?: number, types?: string }} opts
 */
export async function searchPlaces({ query, proximity, bbox, limit = 10, types = 'poi,place,locality', country = 'in' }) {
  const params = {
    limit: String(Math.min(limit, 10)),
    types,
    language: 'en',
  };
  if (proximity) {
    params.proximity = `${proximity.lng},${proximity.lat}`;
  }
  if (bbox) {
    params.bbox = bbox;
  }
  if (country) {
    params.country = country;
  }

  const data = await mapboxFetch(
    `/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
    params,
  );

  return (data.features || []).map((f) => ({
    id: f.id,
    name: f.text || f.place_name,
    fullName: f.place_name,
    latitude: f.center?.[1],
    longitude: f.center?.[0],
    categories: f.properties?.category?.split(', ') || [],
    placeType: f.place_type?.[0] || null,
    relevance: f.relevance ?? 0,
  }));
}

/**
 * Pick the most travel-relevant place from reverse-geocode results at a route point.
 */
export function pickPrimaryLocality(features) {
  if (!features?.length) return null;
  return (
    features.find((f) => f.placeType === 'district') ||
    features.find((f) => f.placeType === 'place') ||
    features.find((f) => f.placeType === 'locality') ||
    features[0]
  );
}

/**
 * Reverse geocode a coordinate to nearby towns / localities.
 * Mapbox requires omitting limit (or using limit with a single type only).
 */
export async function reverseGeocodePlace(lat, lng) {
  const data = await mapboxFetch(`/geocoding/v5/mapbox.places/${lng},${lat}.json`, {
    language: 'en',
  });

  const allowed = new Set(['place', 'locality', 'district']);

  return (data.features || [])
    .filter((f) => allowed.has(f.place_type?.[0]))
    .map((f) => ({
      id: f.id,
      name: f.text || f.place_name,
      fullName: f.place_name,
      latitude: f.center?.[1],
      longitude: f.center?.[0],
      categories: f.properties?.category?.split(', ') || [],
      placeType: f.place_type?.[0] || null,
      relevance: f.relevance ?? 0.5,
    }));
}

/**
 * Geocode a place name.
 */
export async function geocodePlace(query) {
  const results = await searchPlaces({ query, limit: 1 });
  return results[0] || null;
}

/**
 * Get driving route between two points.
 */
export async function getRoute(fromLng, fromLat, toLng, toLat, profile = 'driving') {
  const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
  const data = await mapboxFetch(`/directions/v5/mapbox/${profile}/${coords}`, {
    geometries: 'geojson',
    overview: 'full',
  });
  const route = data.routes?.[0];
  if (!route) return null;
  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
  };
}

/**
 * Sample waypoints along a GeoJSON LineString for place discovery (legacy index-based).
 * @param {{ type: string, coordinates: number[][] }} geometry
 * @param {number} samples
 */
export function sampleRoutePoints(geometry, samples = 8) {
  const coords = geometry?.coordinates || [];
  if (coords.length === 0) return [];
  if (coords.length <= samples) {
    return coords.map(([lng, lat]) => ({ lat, lng }));
  }
  const points = [];
  for (let i = 0; i < samples; i++) {
    const idx = Math.floor((i / (samples - 1)) * (coords.length - 1));
    const [lng, lat] = coords[idx];
    points.push({ lat, lng });
  }
  return points;
}

export function normalizePlaceName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Whether a place name overlaps origin or destination.
 */
export function isEndpointPlace(placeName, startName, destName) {
  const n = normalizePlaceName(placeName);
  const s = normalizePlaceName(startName);
  const d = normalizePlaceName(destName);
  if (!n) return true;
  if (s && (n === s || n.includes(s) || s.includes(n))) return true;
  if (d && (n === d || n.includes(d) || d.includes(n))) return true;
  return false;
}

/**
 * Deduplicate places within minKm of each other, keeping the best scorer.
 */
export function dedupeByProximity(places, minKm = 8, scoreFn = (p) => -(p.distanceFromRouteKm ?? 99)) {
  const kept = [];
  for (const place of places.sort((a, b) => scoreFn(b) - scoreFn(a))) {
    if (place.latitude == null || place.longitude == null) continue;
    const tooClose = kept.some(
      (k) => distanceKm(k.latitude, k.longitude, place.latitude, place.longitude) < minKm,
    );
    if (!tooClose) kept.push(place);
  }
  return kept;
}
