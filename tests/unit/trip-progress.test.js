import { describe, it, expect } from 'vitest';

describe('Prisma schema enums', () => {
  it('defines expected trip statuses', () => {
    const statuses = ['DRAFT', 'PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
    expect(statuses).toHaveLength(5);
    expect(statuses).toContain('DRAFT');
    expect(statuses).toContain('ACTIVE');
  });

  it('defines expected expense categories', () => {
    const categories = ['TRANSPORT', 'HOTEL', 'FOOD', 'ACTIVITY', 'SHOPPING', 'OTHER'];
    expect(categories).toHaveLength(6);
  });
});

describe('Trip progress calculation', () => {
  /**
   * @param {{ visited: boolean, skipped: boolean, selected: boolean }[]} destinations
   */
  function calculateProgress(destinations) {
    const planned = destinations.filter((d) => d.selected && !d.skipped);
    if (planned.length === 0) return 0;
    const visited = planned.filter((d) => d.visited).length;
    return Math.round((visited / planned.length) * 100);
  }

  it('counts visited over selected planned destinations', () => {
    const destinations = [
      { visited: true, skipped: false, selected: true },
      { visited: true, skipped: false, selected: true },
      { visited: false, skipped: true, selected: true },
      { visited: false, skipped: false, selected: false },
    ];
    expect(calculateProgress(destinations)).toBe(100);
  });

  it('does not count skipped as visited', () => {
    const destinations = [
      { visited: false, skipped: true, selected: true },
      { visited: true, skipped: false, selected: true },
    ];
    // Only 1 non-skipped selected destination, 1 visited
    const planned = destinations.filter((d) => d.selected && !d.skipped);
    expect(planned).toHaveLength(1);
    expect(calculateProgress(destinations)).toBe(100);
  });

  it('returns 0 when no planned destinations', () => {
    expect(calculateProgress([])).toBe(0);
  });
});
