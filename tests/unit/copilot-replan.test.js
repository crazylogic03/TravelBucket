import { describe, it, expect } from 'vitest';
import { toolDefinitions, executeTool } from '../../backend/src/ai/tools/index.js';
import {
  replanOutputSchema,
  tripSummarySchema,
  copilotResponseSchema,
} from '../../backend/src/ai/schemas/agent.schemas.js';

function buildDeterministicReplanDiffLocal(trip, remaining, skipped, reason) {
  return {
    summary: reason || `Rebalanced ${remaining.length} remaining stop(s).`,
    removed: skipped.map((d) => d.name),
    added: [],
    moved: [],
    timeChanges: [],
    budgetImpact: 0,
  };
}

describe('copilot tools registry', () => {
  it('registers expected tool names', () => {
    const names = toolDefinitions.map((t) => t.function.name);
    expect(names).toContain('get_eta');
    expect(names).toContain('search_restaurants');
    expect(names).toContain('calculate_budget_status');
    expect(names.length).toBeGreaterThanOrEqual(10);
  });

  it('calculate_distance returns km without AI', async () => {
    const result = await executeTool(
      'calculate_distance',
      { fromLat: 28.6139, fromLng: 77.209, toLat: 32.2396, toLng: 77.1887 },
      { userId: 'test' },
    );
    expect(result.distanceKm).toBeGreaterThan(300);
  });
});

describe('replan schema', () => {
  it('validates replan diff payload', () => {
    const result = replanOutputSchema.safeParse({
      summary: 'Moved Day 2 activities later',
      removed: ['Mandi'],
      added: [],
      moved: [{ name: 'Shimla', fromDay: 2, toDay: 3 }],
      timeChanges: [{ title: 'Lunch', oldTime: '13:00', newTime: '14:00' }],
      budgetImpact: -500,
    });
    expect(result.success).toBe(true);
  });
});

describe('trip summary schema', () => {
  it('validates summary payload', () => {
    const result = tripSummarySchema.safeParse({
      headline: 'Delhi to Manali — 85% complete',
      narrative: 'You visited 4 stops and stayed under budget.',
      highlights: ['Shimla', 'Rohtang Pass'],
      tipForNextTrip: 'Add buffer for mountain weather delays.',
    });
    expect(result.success).toBe(true);
  });
});

describe('copilot response schema', () => {
  it('validates assistant message shape', () => {
    const result = copilotResponseSchema.safeParse({
      message: 'Your ETA is about 45 minutes.',
      suggestions: ['Find food nearby'],
    });
    expect(result.success).toBe(true);
  });
});

describe('deterministic replan fallback shape', () => {
  it('produces summary for skipped stops', () => {
    const diff = buildDeterministicReplanDiffLocal(
      { numberOfDays: 3, budgetAmount: 50000 },
      [{ name: 'Shimla' }],
      [{ name: 'Mandi' }],
      'Skipped Mandi due to delay',
    );
    expect(diff.removed).toContain('Mandi');
    expect(diff.summary).toMatch(/Skipped Mandi/);
  });
});
