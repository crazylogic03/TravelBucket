import { groqProvider } from '../providers/groqProvider.js';
import { SUMMARY_SYSTEM_PROMPT } from '../prompts/replan.prompt.js';
import { tripSummarySchema } from '../schemas/agent.schemas.js';
import { calculateBudgetStatus } from '../../services/expenses/expense.calculator.js';
import { calculateProgress } from '../../services/trips/liveTrip.service.js';

/**
 * Generate trip summary narrative from facts.
 */
export async function runTripSummaryAgent({ trip, destinations, expenses, events, userId }) {
  const visited = destinations.filter((d) => d.status === 'VISITED');
  const skipped = destinations.filter((d) => d.status === 'SKIPPED');
  const budget = calculateBudgetStatus({ ...trip, expenses });

  const facts = {
    title: trip.title,
    route: `${trip.startLocationName} → ${trip.destinationName}`,
    dates: { start: trip.startDate, end: trip.endDate, days: trip.numberOfDays },
    transportMode: trip.transportMode,
    travelerCount: trip.travelerCount,
    progressPercentage: calculateProgress(destinations),
    visited: visited.map((d) => d.name),
    skipped: skipped.map((d) => ({ name: d.name, reason: d.skipReason })),
    budget: {
      planned: Number(trip.budgetAmount),
      spent: budget.totalSpent,
      currency: trip.currency,
      variance: budget.budgetVariance,
    },
    eventCount: events?.length || 0,
  };

  try {
    const result = await groqProvider.chat({
      agentType: 'TripSummaryAgent',
      userId,
      tripId: trip.id,
      json: true,
      temperature: 0.4,
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(facts) },
      ],
    });

    const parsed = JSON.parse(result.content);
    const validated = tripSummarySchema.safeParse(parsed);
    if (validated.success) {
      return {
        summary: validated.data,
        stats: buildStats(trip, destinations, expenses, budget),
        meta: { model: result.model, latencyMs: result.latencyMs },
      };
    }
  } catch {
    // fallback
  }

  return {
    summary: buildDeterministicSummary(facts),
    stats: buildStats(trip, destinations, expenses, budget),
    meta: { fallback: true },
  };
}

function buildStats(trip, destinations, expenses, budget) {
  const selected = destinations.filter((d) => d.selected);
  return {
    route: `${trip.startLocationName} → ${trip.destinationName}`,
    days: trip.numberOfDays,
    destinationsVisited: selected.filter((d) => d.status === 'VISITED').length,
    destinationsSkipped: selected.filter((d) => d.status === 'SKIPPED').length,
    destinationsTotal: selected.length,
    progressPercentage: calculateProgress(destinations),
    totalSpent: budget.totalSpent,
    budgetAmount: Number(trip.budgetAmount),
    currency: trip.currency,
    expenseCount: expenses.length,
    byCategory: budget.byCategory,
  };
}

function buildDeterministicSummary(facts) {
  const highlights = facts.visited.slice(0, 5);
  if (facts.skipped.length) {
    highlights.push(`Skipped: ${facts.skipped.map((s) => s.name).join(', ')}`);
  }

  return {
    headline: `${facts.title} — ${facts.progressPercentage}% complete`,
    narrative: `You traveled ${facts.route} over ${facts.dates.days} day(s). You visited ${facts.visited.length} stop(s)${
      facts.skipped.length ? ` and skipped ${facts.skipped.length}` : ''
    }. Total spend: ${facts.budget.currency} ${facts.budget.spent.toLocaleString()} of ${facts.budget.currency} ${facts.budget.planned.toLocaleString()}.`,
    highlights,
    tipForNextTrip:
      facts.budget.variance > 0
        ? 'Next time, add a 10–15% buffer for food and unplanned stops.'
        : 'Great pacing — reuse this budget split for similar trips.',
  };
}
