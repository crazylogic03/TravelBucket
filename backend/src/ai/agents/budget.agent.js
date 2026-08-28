import { z } from 'zod';
import { groqProvider } from '../providers/groqProvider.js';
import { BUDGET_SYSTEM_PROMPT } from '../prompts/budget.prompt.js';
import { calculateBudgetStatus } from '../../services/expenses/expense.calculator.js';

const budgetAiSchema = z.object({
  statusLabel: z.string(),
  explanation: z.string(),
  suggestions: z.array(z.string()).max(6),
});

/**
 * Budget Agent — explains deterministic calculations.
 */
export async function runBudgetAgent({ trip, remainingDestinations = [], userId }) {
  const numbers = calculateBudgetStatus(trip);

  let statusLabel = 'You are on track.';
  if (numbers.percentFasterThanPlan > 10) {
    statusLabel = `You are spending ${numbers.percentFasterThanPlan}% faster than planned.`;
  } else if (numbers.budgetVariance > 0) {
    statusLabel = `At your current pace you may exceed your budget by ${trip.currency || 'INR'} ${Math.round(numbers.budgetVariance).toLocaleString()}.`;
  } else if (numbers.percentFasterThanPlan < -10) {
    statusLabel = 'You are spending slower than planned — good buffer remaining.';
  }

  const deterministic = {
    statusLabel,
    explanation: buildDeterministicExplanation(numbers, trip),
    suggestions: buildDeterministicSuggestions(numbers, remainingDestinations, trip),
    numbers,
  };

  try {
    const result = await groqProvider.chat({
      agentType: 'BudgetAgent',
      userId,
      tripId: trip.id,
      json: true,
      temperature: 0.2,
      messages: [
        { role: 'system', content: BUDGET_SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            numbers,
            remainingDestinations: remainingDestinations.map((d) => ({
              name: d.name,
              estimatedCost: d.estimatedCost != null ? Number(d.estimatedCost) : null,
            })),
            currency: trip.currency,
            instruction:
              'Explain the situation using ONLY these numbers. Return JSON with statusLabel, explanation, suggestions.',
          }),
        },
      ],
    });

    const parsed = JSON.parse(result.content);
    const validated = budgetAiSchema.safeParse(parsed);
    if (validated.success) {
      return {
        ...validated.data,
        numbers,
        meta: { model: result.model, latencyMs: result.latencyMs },
      };
    }
  } catch {
    // fallback below
  }

  return { ...deterministic, meta: { fallback: true } };
}

function buildDeterministicExplanation(n, trip) {
  const cur = trip.currency || 'INR';
  return `Spent ${cur} ${n.totalSpent.toLocaleString()} of ${cur} ${n.budget.toLocaleString()} (${n.daysElapsed} of ${n.totalDays} days). Remaining ${cur} ${n.remaining.toLocaleString()}. Projected final spend ${cur} ${n.projectedFinalSpend.toLocaleString()}.`;
}

function buildDeterministicSuggestions(n, remaining, trip) {
  const cur = trip.currency || 'INR';
  const suggestions = [];
  if (n.budgetVariance > 0) {
    suggestions.push(
      `Reduce daily spend toward ~${cur} ${Math.max(0, Math.round(n.remaining / Math.max(1, n.daysRemaining))).toLocaleString()} for the remaining ${n.daysRemaining} day(s).`,
    );
  } else {
    suggestions.push('You have budget headroom — keep logging expenses to stay accurate.');
  }
  const costly = remaining
    .filter((d) => d.estimatedCost != null)
    .sort((a, b) => Number(b.estimatedCost) - Number(a.estimatedCost))
    .slice(0, 2);
  if (costly.length) {
    suggestions.push(
      `Watch upcoming costs at ${costly.map((d) => d.name).join(' and ')}.`,
    );
  }
  if (n.byCategory.FOOD > n.budget * 0.35) {
    suggestions.push('Food is a large share of spend — consider more local/self-catered meals.');
  }
  return suggestions;
}
