import { describe, it, expect } from 'vitest';
import { GroqKeyPool } from '../../backend/src/ai/key-pool/groqKeyPool.js';
import { buildDeterministicPlan } from '../../backend/src/ai/agents/tripOptimizer.agent.js';
import { discoveryOutputSchema } from '../../backend/src/ai/schemas/agent.schemas.js';
import { distanceKm } from '../../backend/src/services/places/places.service.js';

describe('GroqKeyPool', () => {
  it('rotates away from cooled-down keys', () => {
    const pool = new GroqKeyPool(['key-a', 'key-b'], 60_000);
    const first = pool.selectHealthyKey();
    expect(first.slot).toBe(1);
    pool.markFailure(first, { rateLimited: true });
    const second = pool.selectHealthyKey();
    expect(second.slot).toBe(2);
  });

  it('reports no healthy keys when all cooling down', () => {
    const pool = new GroqKeyPool(['only'], 60_000);
    const slot = pool.selectHealthyKey();
    pool.markFailure(slot);
    expect(pool.selectHealthyKey()).toBeNull();
  });
});

describe('discovery schema', () => {
  it('validates candidate payload', () => {
    const result = discoveryOutputSchema.safeParse({
      candidates: [
        {
          name: 'Shimla',
          description: 'Hill station',
          recommendedDurationMinutes: 120,
          routeRelevanceScore: 0.9,
          preferenceMatchScore: 0.8,
          recommendationReason: 'On the way',
          latitude: 31.1,
          longitude: 77.1,
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe('deterministic optimizer', () => {
  it('creates feasible day count matching trip', () => {
    const plan = buildDeterministicPlan(
      {
        startLocationName: 'Delhi',
        destinationName: 'Manali',
        startDate: '2026-09-15',
        numberOfDays: 3,
        transportMode: 'CAR',
      },
      [
        { name: 'Chandigarh', recommendedDurationMinutes: 90, estimatedCost: 200 },
        { name: 'Mandi', recommendedDurationMinutes: 60, estimatedCost: 300 },
      ],
    );
    expect(plan.days).toHaveLength(3);
    expect(plan.score).toBeGreaterThan(0);
    expect(plan.whyThisPlan.length).toBeGreaterThan(10);
  });
});

describe('distanceKm', () => {
  it('computes roughly correct Delhi-Manali distance', () => {
    const km = distanceKm(28.6139, 77.209, 32.2396, 77.1887);
    expect(km).toBeGreaterThan(350);
    expect(km).toBeLessThan(550);
  });
});
