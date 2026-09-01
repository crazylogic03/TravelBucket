import { describe, it, expect } from 'vitest';
import {
  distanceKm,
  distanceToPolylineKm,
  distanceToSegmentKm,
  sampleRoutePointsByDistance,
  routeLengthKm,
  isEndpointPlace,
  dedupeByProximity,
  normalizePlaceName,
} from '../../backend/src/services/places/places.service.js';

describe('route corridor helpers', () => {
  const chennai = { lat: 13.0827, lng: 80.2707 };
  const hyderabad = { lat: 17.385, lng: 78.4867 };

  // Simplified Chennai → Hyderabad corridor (southwest arc)
  const corridorGeometry = {
    type: 'LineString',
    coordinates: [
      [chennai.lng, chennai.lat],
      [79.42, 13.63],
      [78.85, 14.68],
      [78.35, 15.83],
      [77.95, 16.98],
      [77.65, 18.12],
      [hyderabad.lng, hyderabad.lat],
    ],
  };

  it('computes route length', () => {
    const len = routeLengthKm(corridorGeometry);
    expect(len).toBeGreaterThan(500);
    expect(len).toBeLessThan(850);
  });

  it('samples mid-route points excluding endpoints', () => {
    const points = sampleRoutePointsByDistance(corridorGeometry, {
      fractions: [0.1, 0.25, 0.5, 0.75, 0.9],
      excludeEnds: 0.12,
    });
    expect(points.length).toBeGreaterThanOrEqual(3);
    for (const p of points) {
      expect(p.routeFraction).toBeGreaterThan(0.12);
      expect(p.routeFraction).toBeLessThan(0.88);
      const toStart = distanceKm(chennai.lat, chennai.lng, p.lat, p.lng);
      const toEnd = distanceKm(hyderabad.lat, hyderabad.lng, p.lat, p.lng);
      expect(toStart).toBeGreaterThan(50);
      expect(toEnd).toBeGreaterThan(50);
    }
  });

  it('measures distance to polyline', () => {
    const mid = sampleRoutePointsByDistance(corridorGeometry, { fractions: [0.5] })[0];
    const onRoute = distanceToPolylineKm(mid.lat, mid.lng, corridorGeometry);
    expect(onRoute).toBeLessThan(5);

    const farAway = distanceToPolylineKm(12.97, 77.59, corridorGeometry);
    expect(farAway).toBeGreaterThan(100);
  });

  it('detects endpoint name overlap', () => {
    expect(isEndpointPlace('Chennai', 'Chennai, Tamil Nadu', 'Hyderabad')).toBe(true);
    expect(isEndpointPlace('Hyderabad', 'Chennai', 'Hyderabad, Telangana')).toBe(true);
    expect(isEndpointPlace('Anantapur', 'Chennai', 'Hyderabad')).toBe(false);
  });

  it('dedupes nearby places', () => {
    const places = [
      { name: 'A', latitude: 15.0, longitude: 77.0, distanceFromRouteKm: 5 },
      { name: 'B', latitude: 15.01, longitude: 77.01, distanceFromRouteKm: 8 },
      { name: 'C', latitude: 16.5, longitude: 78.0, distanceFromRouteKm: 10 },
    ];
    const deduped = dedupeByProximity(places, 15);
    expect(deduped.length).toBe(2);
    expect(deduped.some((p) => p.name === 'A')).toBe(true);
    expect(deduped.some((p) => p.name === 'C')).toBe(true);
  });

  it('normalizes place names', () => {
    expect(normalizePlaceName('Chennai, Tamil Nadu')).toBe('chennai tamil nadu');
  });

  it('point-to-segment distance is zero on segment midpoint', () => {
    const d = distanceToSegmentKm(14.0, 79.0, 13.0, 79.0, 15.0, 79.0);
    expect(d).toBeLessThan(1);
  });
});

describe('route-aware filtering logic', () => {
  const geometry = {
    coordinates: [
      [80.27, 13.08],
      [79.5, 14.0],
      [78.8, 15.5],
      [78.48, 17.38],
    ],
  };

  it('rejects places too close to destination', () => {
    const nearDest = { lat: 17.39, lng: 78.49 };
    const dist = distanceToPolylineKm(nearDest.lat, nearDest.lng, geometry);
    expect(dist).toBeLessThan(20);
    const toEnd = distanceKm(17.385, 78.4867, nearDest.lat, nearDest.lng);
    expect(toEnd).toBeLessThan(15);
  });

  it('accepts mid-route places like Anantapur corridor', () => {
    const anantapurArea = { lat: 14.68, lng: 78.85 };
    const dist = distanceToPolylineKm(anantapurArea.lat, anantapurArea.lng, geometry);
    expect(dist).toBeLessThan(80);
    const toStart = distanceKm(13.08, 80.27, anantapurArea.lat, anantapurArea.lng);
    const toEnd = distanceKm(17.385, 78.4867, anantapurArea.lat, anantapurArea.lng);
    expect(toStart).toBeGreaterThan(100);
    expect(toEnd).toBeGreaterThan(100);
  });
});
