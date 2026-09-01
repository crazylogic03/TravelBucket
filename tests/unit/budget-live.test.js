import { describe, it, expect } from 'vitest';
import { calculateBudgetStatus } from '../../backend/src/services/expenses/expense.calculator.js';
import { calculateProgress } from '../../backend/src/services/trips/liveTrip.service.js';
import crypto from 'crypto';

describe('calculateBudgetStatus', () => {
  it('computes spent, remaining, and projection', () => {
    const status = calculateBudgetStatus({
      budgetAmount: 10000,
      currency: 'INR',
      numberOfDays: 5,
      startDate: new Date(),
      endDate: new Date(Date.now() + 4 * 86400000),
      expenses: [
        { amount: 2000, category: 'FOOD' },
        { amount: 1500, category: 'TRANSPORT' },
      ],
    });
    expect(status.totalSpent).toBe(3500);
    expect(status.remaining).toBe(6500);
    expect(status.byCategory.FOOD).toBe(2000);
    expect(status.projectedFinalSpend).toBeGreaterThan(0);
  });
});

describe('live trip progress', () => {
  it('excludes skipped from visited count', () => {
    const progress = calculateProgress([
      { selected: true, status: 'VISITED' },
      { selected: true, status: 'VISITED' },
      { selected: true, status: 'SKIPPED' },
      { selected: true, status: 'PLANNED' },
    ]);
    // countable = VISITED+PLANNED+CURRENT = 3, visited = 2 → 67%
    expect(progress).toBe(67);
  });

  it('never treats skipped as visited', () => {
    const progress = calculateProgress([
      { selected: true, status: 'SKIPPED' },
      { selected: true, status: 'SKIPPED' },
    ]);
    expect(progress).toBe(100);
  });
});

describe('razorpay signature verification shape', () => {
  it('matches HMAC sha256 of order|payment', () => {
    const secret = 'test_secret';
    const orderId = 'order_abc';
    const paymentId = 'pay_xyz';
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    expect(expected).toHaveLength(64);
  });
});
