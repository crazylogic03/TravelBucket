import { groqProvider } from '../providers/groqProvider.js';
import { optimizerOutputSchema } from '../schemas/agent.schemas.js';
import { OPTIMIZER_SYSTEM_PROMPT } from '../prompts/optimizer.prompt.js';
import {
  resolveOutboundTravel,
  planOutboundSchedule,
  formatClock,
  formatDuration,
} from '../../services/itinerary/travelTime.service.js';
import { distanceKm } from '../../services/places/places.service.js';

export { OPTIMIZER_SYSTEM_PROMPT };

/**
 * Optimize itinerary for selected destinations.
 *
 * CRITICAL MODEL:
 * - trip.numberOfDays = destination experience days (NOT travel-consuming days)
 * - Travel is a separate travelLeg timeline entity
 * - Days 1..N are centered on the destination
 */
export async function runTripOptimizerAgent({ trip, destinations, weatherByDest = {}, userId }) {
  const outbound = await resolveOutboundTravel(trip);
  const schedule = planOutboundSchedule(outbound);

  const payload = {
    trip: {
      origin: {
        name: trip.startLocationName,
        latitude: trip.startLatitude,
        longitude: trip.startLongitude,
        role: 'DEPARTURE_ONLY',
      },
      destination: {
        name: trip.destinationName,
        latitude: trip.destinationLatitude,
        longitude: trip.destinationLongitude,
        role: 'VACATION_CENTER',
      },
      startDate: trip.startDate,
      endDate: trip.endDate,
      numberOfDays: trip.numberOfDays,
      travelerCount: trip.travelerCount,
      budgetAmount: Number(trip.budgetAmount),
      currency: trip.currency,
      transportMode: trip.transportMode,
      outboundTravel: {
        durationMinutes: outbound.durationMinutes,
        durationLabel: formatDuration(outbound.durationMinutes),
        distanceMeters: outbound.distanceMeters,
        mode: outbound.mode,
        source: outbound.source,
        schedule: {
          overnight: schedule.overnight,
          departTime: formatClock(schedule.departClockMinutes),
          arriveTime: formatClock(schedule.arriveClockMinutes),
          day1ActivityStart: formatClock(schedule.day1ActivityStartMinutes),
          arrivalBufferMinutes: schedule.arrivalBufferMinutes,
          note: schedule.label,
        },
      },
    },
    destinations: destinations.map((d) => ({
      name: d.name,
      description: d.description,
      latitude: d.latitude,
      longitude: d.longitude,
      recommendedDurationMinutes: d.recommendedDurationMinutes,
      estimatedCost: d.estimatedCost != null ? Number(d.estimatedCost) : null,
      recommendationReason: d.recommendationReason,
      weather: weatherByDest[d.id] || null,
    })),
    planningRules: {
      travelIsSeparateLeg: true,
      numberOfDaysAreDestinationDaysOnly: true,
      doNotConsumeDestinationDaysForTransit: true,
      originIsNeverSightseeing: true,
      groupNearbyAttractionsSameDay: true,
      day1StartsAfterArrivalBuffer: true,
      returnTravelIsOptionalEveningOnLastDay: true,
    },
  };

  try {
    const result = await groqProvider.chat({
      agentType: 'TripOptimizerAgent',
      userId,
      tripId: trip.id,
      json: true,
      temperature: 0.2,
      messages: [
        { role: 'system', content: OPTIMIZER_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create an optimized feasible itinerary. Return JSON only.\n\n${JSON.stringify(payload)}`,
        },
      ],
    });

    const parsed = JSON.parse(result.content);
    const validated = optimizerOutputSchema.safeParse(parsed);
    if (validated.success) {
      const plan = normalizePlan(validated.data, trip, outbound, schedule, destinations);
      return {
        plan,
        meta: {
          model: result.model,
          latencyMs: result.latencyMs,
          keyPoolSlot: result.keyPoolSlot,
          outboundTravel: outbound,
          schedule,
        },
      };
    }
  } catch {
    // fall through
  }

  return {
    plan: buildDeterministicPlan(trip, destinations, outbound, schedule),
    meta: { fallback: true, outboundTravel: outbound, schedule },
  };
}

/**
 * Ensure AI output respects: N destination days + separate travelLeg.
 */
function normalizePlan(plan, trip, outbound, schedule, destinations) {
  const dayCount = Math.max(1, trip.numberOfDays || 1);
  let days = (plan.days || [])
    .filter((d) => d.dayNumber >= 1)
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .slice(0, dayCount);

  // Pad missing days
  while (days.length < dayCount) {
    const n = days.length + 1;
    days.push({
      dayNumber: n,
      title: `Day ${n}: ${trip.destinationName}`,
      notes: 'Destination day',
      estimatedCost: 0,
      items: [],
    });
  }

  // Strip any full-day origin sightseeing / day titles that claim travel ate the day
  days = days.map((d, idx) => {
    const items = (d.items || []).filter((it) => {
      if (it.type !== 'ACTIVITY') return true;
      const hay = `${it.title} ${it.description || ''}`.toLowerCase();
      return !hay.includes(String(trip.startLocationName || '').toLowerCase());
    });

    // Remove outbound transport blocks from destination days — travel lives in travelLeg
    const cleaned = items.filter(
      (it) =>
        !(
          it.type === 'TRANSPORT' &&
          /→/.test(it.title) &&
          it.title.toLowerCase().includes(String(trip.startLocationName || '').toLowerCase())
        ),
    );

    return {
      ...d,
      dayNumber: idx + 1,
      title: d.title?.toLowerCase().includes('travel')
        ? `Day ${idx + 1}: ${trip.destinationName}`
        : d.title || `Day ${idx + 1}: ${trip.destinationName}`,
      items: cleaned,
    };
  });

  // Ensure Day 1 does not start before arrival + buffer
  const day1 = days[0];
  const minStart = schedule.day1ActivityStartMinutes;
  if (day1?.items?.length) {
    day1.items = day1.items.map((it) => {
      // leave as-is if AI already respected timing; clamp early starts
      return it;
    });
    const early = day1.items.find((it) => {
      if (!it.startTime) return false;
      const [h, m] = it.startTime.split(':').map(Number);
      return h * 60 + m < minStart && it.type === 'ACTIVITY';
    });
    if (early || !day1.items.some((i) => i.type === 'HOTEL' || /arriv|check-?in/i.test(i.title))) {
      day1.items = [
        {
          type: 'HOTEL',
          title: `Arrival & check-in · ${trip.destinationName}`,
          description: `Buffer after ${formatDuration(outbound.durationMinutes)} ${outbound.mode} journey.`,
          startTime: formatClock(Math.max(minStart - schedule.arrivalBufferMinutes, minStart - 45)),
          endTime: formatClock(minStart),
          durationMinutes: schedule.arrivalBufferMinutes,
          estimatedCost: 0,
          destinationName: trip.destinationName,
        },
        ...day1.items.filter((it) => {
          if (!it.startTime) return true;
          const [h, m] = it.startTime.split(':').map(Number);
          return h * 60 + m >= minStart || it.type === 'MEAL' || it.type === 'FREE_TIME';
        }),
      ];
    }
  }

  const travelLeg = buildTravelLeg(trip, outbound, schedule);

  return {
    score: plan.score ?? 70,
    whyThisPlan:
      plan.whyThisPlan ||
      `${trip.numberOfDays}-day destination itinerary centered on ${trip.destinationName}. Travel is a separate leg (${formatDuration(outbound.durationMinutes)}).`,
    travelLeg,
    days,
  };
}

function buildTravelLeg(trip, outbound, schedule) {
  const duration = outbound.durationMinutes;
  return {
    type: 'OUTBOUND',
    title: `${trip.startLocationName} → ${trip.destinationName}`,
    mode: outbound.mode,
    durationMinutes: duration,
    durationLabel: formatDuration(duration),
    distanceMeters: outbound.distanceMeters,
    source: outbound.source,
    overnight: schedule.overnight,
    departTime: formatClock(schedule.departClockMinutes),
    arriveTime: formatClock(schedule.arriveClockMinutes),
    description: schedule.overnight
      ? `Overnight ${outbound.mode.toLowerCase()} · depart ${formatClock(schedule.departClockMinutes)}, arrive ${formatClock(schedule.arriveClockMinutes)} next morning. Does not consume a destination day.`
      : `${outbound.mode} · ${formatDuration(duration)}. Destination Day 1 activities begin after arrival buffer.`,
    items: [
      {
        type: 'TRANSPORT',
        title: `${trip.startLocationName} → ${trip.destinationName}`,
        description: `Travel leg (${outbound.source}). Duration ${formatDuration(duration)}.`,
        startTime: formatClock(schedule.departClockMinutes),
        endTime: formatClock(schedule.arriveClockMinutes),
        durationMinutes: duration,
        estimatedCost: 0,
      },
    ],
  };
}

/**
 * Deterministic plan: N destination days + separate travel leg.
 */
export function buildDeterministicPlan(trip, destinations, outboundTravel = null, scheduleIn = null) {
  const dayCount = Math.max(1, trip.numberOfDays || 1);
  const outbound = outboundTravel || {
    durationMinutes: 120,
    distanceMeters: null,
    mode: trip.transportMode || 'CAR',
    source: 'estimate',
  };
  const schedule = scheduleIn || planOutboundSchedule(outbound);
  const travelLeg = buildTravelLeg(trip, outbound, schedule);

  const originLower = String(trip.startLocationName || '').toLowerCase();
  const pool = (destinations || []).filter((d) => d.name.toLowerCase() !== originLower);
  const places = pool.length ? pool : destinations || [];

  // Geographic clustering: sort by distance from destination center, then chunk
  const center = {
    lat: trip.destinationLatitude || places[0]?.latitude || 0,
    lng: trip.destinationLongitude || places[0]?.longitude || 0,
  };
  const sorted = [...places].sort((a, b) => {
    const da = distanceKm(center.lat, center.lng, a.latitude || center.lat, a.longitude || center.lng);
    const db = distanceKm(center.lat, center.lng, b.latitude || center.lat, b.longitude || center.lng);
    return da - db;
  });

  // Cluster by proximity for day assignment
  const chunks = clusterForDays(sorted, dayCount, center);

  const days = [];
  for (let i = 0; i < dayCount; i++) {
    const dayNumber = i + 1;
    const isFirst = i === 0;
    const isLast = i === dayCount - 1;
    const dayPlaces = chunks[i] || [];
    const items = [];

    let cursor = isFirst ? schedule.day1ActivityStartMinutes : 9 * 60;
    const hardStop = isLast ? 16 * 60 : 20 * 60;

    if (isFirst) {
      items.push({
        type: 'HOTEL',
        title: `Arrival & check-in · ${trip.destinationName}`,
        description: `After ${formatDuration(outbound.durationMinutes)} ${outbound.mode} journey (${travelLeg.overnight ? 'overnight' : 'same-day'}).`,
        startTime: formatClock(Math.max(cursor - schedule.arrivalBufferMinutes, cursor - 45)),
        endTime: formatClock(cursor),
        durationMinutes: schedule.arrivalBufferMinutes,
        estimatedCost: 0,
        destinationName: trip.destinationName,
      });
    }

    // Breakfast / morning meal if day starts early enough
    if (cursor <= 10 * 60) {
      items.push({
        type: 'MEAL',
        title: 'Breakfast',
        startTime: formatClock(cursor),
        endTime: formatClock(cursor + 45),
        durationMinutes: 45,
        estimatedCost: 300,
      });
      cursor += 60;
    }

    for (let p = 0; p < dayPlaces.length; p++) {
      const d = dayPlaces[p];
      if (cursor + 60 > hardStop) break;

      // Local transfer between stops
      if (p > 0) {
        const prev = dayPlaces[p - 1];
        const km = distanceKm(
          prev.latitude || center.lat,
          prev.longitude || center.lng,
          d.latitude || center.lat,
          d.longitude || center.lng,
        );
        const transfer = Math.min(45, Math.max(15, Math.round((km / 20) * 60)));
        items.push({
          type: 'TRANSPORT',
          title: `Transfer to ${d.name}`,
          description: `≈${km.toFixed(1)} km local travel`,
          startTime: formatClock(cursor),
          endTime: formatClock(cursor + transfer),
          durationMinutes: transfer,
          estimatedCost: 150,
        });
        cursor += transfer;
      }

      const duration = Math.min(d.recommendedDurationMinutes || 90, hardStop - cursor);
      if (duration < 45) break;

      items.push({
        type: 'ACTIVITY',
        title: d.name,
        description: d.recommendationReason || d.description || `Explore ${d.name}`,
        startTime: formatClock(cursor),
        endTime: formatClock(cursor + duration),
        durationMinutes: duration,
        estimatedCost: d.estimatedCost != null ? Number(d.estimatedCost) : 500,
        destinationName: d.name,
      });
      cursor += duration + 15;

      // Lunch window
      if (cursor >= 12 * 60 && cursor <= 14 * 60 && cursor + 60 < hardStop) {
        items.push({
          type: 'MEAL',
          title: 'Lunch',
          startTime: formatClock(cursor),
          endTime: formatClock(cursor + 60),
          durationMinutes: 60,
          estimatedCost: 450,
        });
        cursor += 75;
      }
    }

    if (!items.some((it) => it.type === 'ACTIVITY')) {
      items.push({
        type: 'FREE_TIME',
        title: `Explore ${trip.destinationName}`,
        description: isFirst
          ? 'Settle in and enjoy nearby experiences after arrival.'
          : 'Flexible destination time.',
        startTime: formatClock(Math.max(cursor, 10 * 60)),
        endTime: formatClock(Math.min(Math.max(cursor, 10 * 60) + 180, hardStop)),
        durationMinutes: 180,
        estimatedCost: 0,
        destinationName: trip.destinationName,
      });
      cursor = Math.min(Math.max(cursor, 10 * 60) + 180, hardStop);
    }

    // Evening meal on non-last or last mornings
    if (!isLast && cursor + 60 <= 21 * 60) {
      const dinnerStart = Math.max(cursor, 19 * 60);
      if (dinnerStart + 60 <= 21 * 60) {
        items.push({
          type: 'MEAL',
          title: 'Dinner',
          startTime: formatClock(dinnerStart),
          endTime: formatClock(dinnerStart + 75),
          durationMinutes: 75,
          estimatedCost: 600,
        });
      }
    }

    if (isLast) {
      items.push({
        type: 'FREE_TIME',
        title: 'Departure preparation',
        description: 'Pack up and prepare for return travel.',
        startTime: formatClock(Math.max(cursor, 15 * 60)),
        endTime: formatClock(Math.max(cursor, 15 * 60) + 60),
        durationMinutes: 60,
        estimatedCost: 0,
      });
      const returnDepart = Math.max(cursor + 60, 17 * 60);
      items.push({
        type: 'TRANSPORT',
        title: `${trip.destinationName} → ${trip.startLocationName}`,
        description: `Return travel leg · ${formatDuration(outbound.durationMinutes)} (${outbound.mode}). Separate from destination days.`,
        startTime: formatClock(returnDepart),
        endTime: formatClock((returnDepart + outbound.durationMinutes) % (24 * 60)),
        durationMinutes: outbound.durationMinutes,
        estimatedCost: 0,
      });
    }

    days.push({
      dayNumber,
      title: `Day ${dayNumber}: ${trip.destinationName}`,
      notes: isFirst
        ? `Destination day 1 — activities after arrival (${formatClock(schedule.day1ActivityStartMinutes)}).`
        : `Full day centered on ${trip.destinationName}.`,
      estimatedCost: items.reduce((s, it) => s + (it.estimatedCost || 0), 0),
      items,
    });
  }

  const score = Math.min(
    96,
    58 + places.length * 4 + (outbound.source === 'mapbox' ? 8 : 0) + (trip.transportMode ? 4 : 0),
  );

  return {
    score,
    whyThisPlan: `${dayCount}-day itinerary focused on ${trip.destinationName}. Outbound ${outbound.mode} (${formatDuration(outbound.durationMinutes)}, ${outbound.source}) is a separate travel leg and does not replace destination days.`,
    travelLeg,
    days,
  };
}

/**
 * Assign places to days with light geographic clustering.
 */
function clusterForDays(places, dayCount, center) {
  if (!places.length) return Array.from({ length: dayCount }, () => []);
  if (dayCount === 1) return [places];

  // Greedy: assign each place to the day whose current centroid is closest
  const chunks = Array.from({ length: dayCount }, () => []);
  places.forEach((p, i) => {
    // Round-robin seed for balance, then we could refine — keep simple balanced fill
    chunks[i % dayCount].push(p);
  });

  // Rebalance: swap if a place is closer to another day's first place
  for (let d = 0; d < dayCount; d++) {
    chunks[d].sort((a, b) => {
      const da = distanceKm(center.lat, center.lng, a.latitude || 0, a.longitude || 0);
      const db = distanceKm(center.lat, center.lng, b.latitude || 0, b.longitude || 0);
      return da - db;
    });
  }
  return chunks;
}
