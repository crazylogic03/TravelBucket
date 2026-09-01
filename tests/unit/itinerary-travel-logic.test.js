import { describe, expect, it } from 'vitest';
import { buildDeterministicPlan } from '../../backend/src/ai/agents/tripOptimizer.agent.js';
import { planOutboundSchedule } from '../../backend/src/services/itinerary/travelTime.service.js';

describe('itinerary: travel leg separate from destination days', () => {
  const trip = {
    startLocationName: 'Anantapur',
    destinationName: 'Pune',
    destinationLatitude: 18.52,
    destinationLongitude: 73.85,
    numberOfDays: 5,
    startDate: '2026-09-01',
    transportMode: 'TRAIN',
    budgetAmount: 30000,
  };

  const destinations = [
    {
      name: 'Shaniwar Wada',
      latitude: 18.519,
      longitude: 73.855,
      recommendedDurationMinutes: 90,
      estimatedCost: 200,
    },
    {
      name: 'Aga Khan Palace',
      latitude: 18.552,
      longitude: 73.901,
      recommendedDurationMinutes: 75,
      estimatedCost: 150,
    },
    {
      name: 'Sinhagad Fort',
      latitude: 18.366,
      longitude: 73.755,
      recommendedDurationMinutes: 180,
      estimatedCost: 300,
    },
    {
      name: 'FC Road Food Walk',
      latitude: 18.517,
      longitude: 73.841,
      recommendedDurationMinutes: 90,
      estimatedCost: 400,
    },
  ];

  const outbound = {
    durationMinutes: 10 * 60 + 30,
    distanceMeters: 650_000,
    mode: 'TRAIN',
    source: 'mapbox',
  };

  it('keeps 5 destination days and a separate travel leg', () => {
    const schedule = planOutboundSchedule(outbound);
    const plan = buildDeterministicPlan(trip, destinations, outbound, schedule);

    expect(plan.days).toHaveLength(5);
    expect(plan.travelLeg).toBeTruthy();
    expect(plan.travelLeg.title).toBe('Anantapur → Pune');
    expect(plan.travelLeg.durationMinutes).toBe(630);
    expect(plan.travelLeg.overnight).toBe(true);

    for (const day of plan.days) {
      expect(day.title.toLowerCase()).toContain('pune');
      expect(day.title.toLowerCase()).not.toMatch(/^travel/);
      const activities = day.items.filter((i) => i.type === 'ACTIVITY');
      for (const a of activities) {
        expect(a.title.toLowerCase()).not.toContain('anantapur');
      }
    }
  });

  it('does not treat long train travel as multi-day transit consuming the trip', () => {
    const schedule = planOutboundSchedule(outbound);
    const plan = buildDeterministicPlan(trip, destinations, outbound, schedule);
    const transitOnlyDays = plan.days.filter((d) =>
      d.items.every((i) => i.type === 'TRANSPORT' || i.type === 'FREE_TIME'),
    );
    // Destination days should not be empty travel-only shells
    expect(transitOnlyDays.length).toBeLessThan(plan.days.length);
    expect(plan.days[0].items.some((i) => /arriv|check-?in/i.test(i.title))).toBe(true);
  });

  it('flight arrival shortens day 1 but keeps 3 destination days', () => {
    const flightTrip = {
      ...trip,
      startLocationName: 'Hyderabad',
      destinationName: 'Mumbai',
      numberOfDays: 3,
      transportMode: 'FLIGHT',
    };
    const flightOutbound = {
      durationMinutes: 2 * 60 + 30,
      distanceMeters: 600_000,
      mode: 'FLIGHT',
      source: 'estimate',
    };
    const schedule = planOutboundSchedule(flightOutbound);
    const plan = buildDeterministicPlan(flightTrip, destinations, flightOutbound, schedule);
    expect(plan.days).toHaveLength(3);
    expect(plan.travelLeg.durationMinutes).toBe(150);
    expect(plan.days.every((d) => d.title.toLowerCase().includes('mumbai'))).toBe(true);
  });
});
