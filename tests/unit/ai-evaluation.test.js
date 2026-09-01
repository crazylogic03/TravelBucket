import { describe, it, expect } from 'vitest';
import {
  evaluationScenarios,
  runEvaluationHarness,
  validateScenarioConstraints,
} from '../ai-evaluation/scenarios.js';

describe('AI evaluation scenarios', () => {
  it('defines 100+ synthetic scenarios', () => {
    expect(evaluationScenarios.length).toBeGreaterThanOrEqual(100);
  });

  it('covers multiple agent types', () => {
    const agents = new Set(evaluationScenarios.map((s) => s.agent));
    expect(agents.size).toBeGreaterThanOrEqual(5);
  });

  it('passes constraint validation for all scenarios', () => {
    const { total, passed, failed } = runEvaluationHarness();
    expect(total).toBeGreaterThanOrEqual(100);
    expect(failed).toBe(0);
    expect(passed).toBe(total);
  });

  it('rejects invalid budget in custom scenario', () => {
    const errors = validateScenarioConstraints({
      agent: 'copilot_budget',
      trip: { budgetAmount: 0, numberOfDays: 3 },
      constraints: { toolsRequiredForNumbers: true },
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
