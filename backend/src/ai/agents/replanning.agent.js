import { groqProvider } from '../providers/groqProvider.js';
import { REPLAN_SYSTEM_PROMPT } from '../prompts/replan.prompt.js';
import { replanOutputSchema } from '../schemas/agent.schemas.js';
import { buildDeterministicPlan } from './tripOptimizer.agent.js';

/**
 * Propose replan diff from current state.
 */
export async function runReplanningAgent({
  trip,
  destinations,
  itineraryDays,
  reason,
  userId,
}) {
  const remaining = destinations.filter(
    (d) => d.selected && ['PLANNED', 'CURRENT'].includes(d.status),
  );
  const skipped = destinations.filter((d) => d.status === 'SKIPPED');

  const payload = {
    reason: reason || 'User requested replan',
    trip: {
      title: trip.title,
      numberOfDays: trip.numberOfDays,
      budgetAmount: Number(trip.budgetAmount),
      currency: trip.currency,
      status: trip.status,
    },
    remainingDestinations: remaining.map((d) => ({
      name: d.name,
      status: d.status,
      estimatedCost: d.estimatedCost != null ? Number(d.estimatedCost) : null,
    })),
    skippedDestinations: skipped.map((d) => d.name),
    currentItinerary: itineraryDays.map((day) => ({
      dayNumber: day.dayNumber,
      title: day.title,
      items: (day.items || []).map((i) => ({
        title: i.title,
        startTime: i.startTime,
        endTime: i.endTime,
        type: i.type,
      })),
    })),
  };

  try {
    const result = await groqProvider.chat({
      agentType: 'ReplanningAgent',
      userId,
      tripId: trip.id,
      json: true,
      temperature: 0.25,
      messages: [
        { role: 'system', content: REPLAN_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(payload) },
      ],
    });

    const parsed = JSON.parse(result.content);
    const validated = replanOutputSchema.safeParse(parsed);
    if (validated.success) {
      return {
        diff: validated.data,
        meta: { model: result.model, latencyMs: result.latencyMs },
      };
    }
  } catch {
    // fallback
  }

  return { diff: buildDeterministicReplanDiff(trip, remaining, skipped, reason), meta: { fallback: true } };
}

function buildDeterministicReplanDiff(trip, remaining, skipped, reason) {
  const removed = skipped.map((d) => d.name);
  const plan = buildDeterministicPlan(trip, remaining);
  const added = [];
  const moved = remaining.slice(1).map((d, idx) => ({
    name: d.name,
    fromDay: idx + 1,
    toDay: (idx % Math.max(1, trip.numberOfDays || 1)) + 1,
  }));

  return {
    summary:
      reason ||
      `Rebalanced ${remaining.length} remaining stop(s) after ${skipped.length} skip(s). Meal buffers preserved.`,
    removed,
    added,
    moved,
    timeChanges: plan.days.flatMap((day) =>
      (day.items || []).slice(0, 2).map((item) => ({
        title: item.title,
        oldTime: null,
        newTime: item.startTime,
      })),
    ),
    budgetImpact: plan.days.reduce((s, d) => s + (d.estimatedCost || 0), 0) - Number(trip.budgetAmount || 0) * 0.1,
  };
}
