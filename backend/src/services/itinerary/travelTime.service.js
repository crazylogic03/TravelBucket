import { getRoute, distanceKm } from '../places/places.service.js';

/**
 * Map YOLO transport modes to Mapbox routing profiles and fallback speeds.
 */
const TRANSPORT_PROFILES = {
  CAR: { profile: 'driving', fallbackKmh: 55 },
  BIKE: { profile: 'cycling', fallbackKmh: 25 },
  BUS: { profile: 'driving', fallbackKmh: 45 },
  TRAIN: { profile: 'driving', fallbackKmh: 70 },
  FLIGHT: { profile: null, fallbackKmh: 700, boardingBufferMinutes: 150 },
};

/**
 * Resolve outbound travel duration from origin → destination.
 */
export async function resolveOutboundTravel(trip) {
  const mode = trip.transportMode || 'CAR';
  const meta = TRANSPORT_PROFILES[mode] || TRANSPORT_PROFILES.CAR;

  const from = { lng: trip.startLongitude, lat: trip.startLatitude };
  const to = { lng: trip.destinationLongitude, lat: trip.destinationLatitude };

  if (meta.profile) {
    try {
      const route = await getRoute(from.lng, from.lat, to.lng, to.lat, meta.profile);
      if (route?.durationSeconds) {
        let durationMinutes = Math.ceil(route.durationSeconds / 60);
        if (mode === 'BUS' || mode === 'TRAIN') durationMinutes += 45;
        return {
          durationMinutes,
          distanceMeters: route.distanceMeters ?? null,
          mode,
          source: 'mapbox',
          geometry: route.geometry || null,
        };
      }
    } catch {
      // fall through
    }
  }

  const km = distanceKm(from.lat, from.lng, to.lat, to.lng);
  let durationMinutes = Math.ceil((km / meta.fallbackKmh) * 60);
  if (mode === 'FLIGHT') durationMinutes += meta.boardingBufferMinutes || 150;
  else if (mode === 'BUS' || mode === 'TRAIN') durationMinutes += 45;

  return {
    durationMinutes: Math.max(30, durationMinutes),
    distanceMeters: Math.round(km * 1000),
    mode,
    source: 'estimate',
    geometry: null,
  };
}

/**
 * Decide when outbound travel should depart so destination days stay intact.
 *
 * Long train/bus/car legs prefer overnight departure so Day 1 at the destination
 * still has a usable morning/afternoon window.
 *
 * @param {{ durationMinutes: number, mode: string }} outbound
 * @returns {{
 *   departClockMinutes: number,
 *   arriveClockMinutes: number,
 *   overnight: boolean,
 *   arrivalBufferMinutes: number,
 *   day1ActivityStartMinutes: number,
 *   label: string
 * }}
 */
export function planOutboundSchedule(outbound) {
  const duration = Math.max(30, outbound.durationMinutes || 120);
  const mode = outbound.mode || 'CAR';
  const arrivalBufferMinutes = mode === 'FLIGHT' ? 75 : 45;

  // Overnight when travel is long enough that a same-morning departure would
  // wipe most of destination Day 1.
  const preferOvernight =
    duration >= 8 * 60 ||
    (duration >= 6 * 60 && (mode === 'TRAIN' || mode === 'BUS'));

  if (preferOvernight) {
    // Example: depart 22:00, 10h → arrive 08:00 next calendar morning (Day 1)
    let depart = 22 * 60;
    if (mode === 'TRAIN' || mode === 'BUS') depart = 21 * 60 + 30;
    if (mode === 'CAR' && duration >= 10 * 60) depart = 20 * 60;

    const arriveRaw = depart + duration;
    const arriveClock = arriveRaw % (24 * 60);
    const day1Start = Math.min(
      18 * 60,
      Math.max(8 * 60, arriveClock + arrivalBufferMinutes),
    );

    return {
      departClockMinutes: depart,
      arriveClockMinutes: arriveClock,
      overnight: true,
      arrivalBufferMinutes,
      day1ActivityStartMinutes: day1Start,
      label: 'Overnight outbound — destination Day 1 starts after arrival',
    };
  }

  // Same-day morning departure for shorter legs / flights
  let depart = mode === 'FLIGHT' ? 7 * 60 : 6 * 60 + 30;
  if (mode === 'FLIGHT') depart = 6 * 60; // allow boarding buffer already in duration
  const arriveClock = depart + duration;
  const day1Start = Math.min(
    16 * 60,
    Math.max(9 * 60, arriveClock + arrivalBufferMinutes),
  );

  return {
    departClockMinutes: depart,
    arriveClockMinutes: arriveClock % (24 * 60),
    overnight: arriveClock >= 24 * 60,
    arrivalBufferMinutes,
    day1ActivityStartMinutes: day1Start,
    label: 'Same-day outbound — Day 1 activities begin after arrival buffer',
  };
}

export function formatClock(minutes) {
  const clamped = ((Math.round(minutes) % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseClock(value) {
  if (!value || typeof value !== 'string') return null;
  const [h, m] = value.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/**
 * Format duration for UI (e.g. 10h 30m).
 */
export function formatDuration(minutes) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
}
