import { describe, it, expect } from 'vitest';
import { tripBasicsSchema, transportSchema } from '../../backend/src/validators/trip.validators.js';

describe('tripBasicsSchema', () => {
  it('accepts valid basics payload', () => {
    const result = tripBasicsSchema.safeParse({
      startLocationName: 'Delhi',
      startLatitude: 28.6,
      startLongitude: 77.2,
      destinationName: 'Manali',
      destinationLatitude: 32.2,
      destinationLongitude: 77.1,
      startDate: '2026-09-15',
      endDate: '2026-09-20',
      travelerCount: 2,
      budgetAmount: 45000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid coordinates', () => {
    const result = tripBasicsSchema.safeParse({
      startLocationName: 'Delhi',
      startLatitude: 128,
      startLongitude: 77.2,
      destinationName: 'Manali',
      destinationLatitude: 32.2,
      destinationLongitude: 77.1,
      startDate: '2026-09-15',
      endDate: '2026-09-20',
      travelerCount: 2,
      budgetAmount: 45000,
    });
    expect(result.success).toBe(false);
  });
});

describe('transportSchema', () => {
  it('accepts transport modes', () => {
    expect(transportSchema.safeParse({ transportMode: 'CAR' }).success).toBe(true);
    expect(transportSchema.safeParse({ transportMode: 'SUBWAY' }).success).toBe(false);
  });
});
