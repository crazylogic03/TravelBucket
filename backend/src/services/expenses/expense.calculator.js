/**
 * Deterministic budget calculations — AI must not do this arithmetic.
 */

/**
 * @param {{ budgetAmount: number|string, expenses: Array<{ amount: number|string, category: string }>, numberOfDays: number, startDate: string|Date, endDate: string|Date }} trip
 */
export function calculateBudgetStatus(trip) {
  const budget = Number(trip.budgetAmount) || 0;
  const expenses = trip.expenses || [];
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const remaining = budget - totalSpent;

  const byCategory = {
    TRANSPORT: 0,
    HOTEL: 0,
    FOOD: 0,
    ACTIVITY: 0,
    SHOPPING: 0,
    OTHER: 0,
  };
  for (const e of expenses) {
    const key = byCategory[e.category] != null ? e.category : 'OTHER';
    byCategory[key] += Number(e.amount || 0);
  }

  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const today = new Date();
  const totalDays = Math.max(
    1,
    trip.numberOfDays ||
      Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1,
  );

  let daysElapsed = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  if (Number.isNaN(daysElapsed) || daysElapsed < 1) daysElapsed = 1;
  if (daysElapsed > totalDays) daysElapsed = totalDays;
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  const averageDailySpend = totalSpent / daysElapsed;
  const plannedDaily = budget / totalDays;
  const projectedFinalSpend = averageDailySpend * totalDays;
  const budgetVariance = projectedFinalSpend - budget;
  const paceRatio = plannedDaily > 0 ? averageDailySpend / plannedDaily : 0;
  const percentFaster = Math.round((paceRatio - 1) * 100);

  return {
    budget,
    currency: trip.currency || 'INR',
    totalSpent: round2(totalSpent),
    remaining: round2(remaining),
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, round2(v)]),
    ),
    daysElapsed,
    daysRemaining,
    totalDays,
    averageDailySpend: round2(averageDailySpend),
    plannedDailySpend: round2(plannedDaily),
    projectedFinalSpend: round2(projectedFinalSpend),
    budgetVariance: round2(budgetVariance),
    percentFasterThanPlan: percentFaster,
    onTrack: projectedFinalSpend <= budget * 1.05,
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
