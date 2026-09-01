/**
 * 100+ synthetic AI evaluation scenarios for YOLO agents.
 * Each scenario describes inputs and expected constraint checks (no live Groq calls).
 */

const TRANSPORTS = ['CAR', 'TRAIN', 'FLIGHT', 'BUS', 'BIKE'];
const REGIONS = [
  { start: 'Delhi', dest: 'Manali', lat: 28.61, lng: 77.21 },
  { start: 'Mumbai', dest: 'Goa', lat: 19.07, lng: 72.87 },
  { start: 'Bangalore', dest: 'Ooty', lat: 12.97, lng: 77.59 },
  { start: 'Chennai', dest: 'Pondicherry', lat: 13.08, lng: 80.27 },
  { start: 'Kolkata', dest: 'Darjeeling', lat: 22.57, lng: 88.36 },
];

const INTENTS = [
  'discovery',
  'optimize',
  'copilot_weather',
  'copilot_food',
  'copilot_eta',
  'copilot_budget',
  'replan_skip',
  'replan_delay',
  'summary_complete',
];

function makeScenario(id, overrides = {}) {
  const region = REGIONS[id % REGIONS.length];
  return {
    id: `scenario-${String(id).padStart(3, '0')}`,
    agent: INTENTS[id % INTENTS.length],
    trip: {
      start: region.start,
      destination: region.dest,
      numberOfDays: 2 + (id % 5),
      budgetAmount: 15000 + (id % 10) * 5000,
      currency: 'INR',
      transportMode: TRANSPORTS[id % TRANSPORTS.length],
      travelerCount: 1 + (id % 4),
    },
    constraints: {
      maxDailyDriveHours: 8,
      budgetMustNotBeInvented: true,
      skippedNotCountedAsVisited: true,
      toolsRequiredForNumbers: true,
    },
    ...overrides,
  };
}

/** @type {object[]} */
export const evaluationScenarios = Array.from({ length: 120 }, (_, i) =>
  makeScenario(i + 1),
);

export function validateScenarioConstraints(scenario) {
  const errors = [];
  if (!scenario.trip.budgetAmount || scenario.trip.budgetAmount <= 0) {
    errors.push('budget must be positive');
  }
  if (!scenario.trip.numberOfDays || scenario.trip.numberOfDays < 1) {
    errors.push('numberOfDays must be >= 1');
  }
  if (scenario.constraints.toolsRequiredForNumbers && scenario.agent.startsWith('copilot')) {
    if (!['copilot_weather', 'copilot_food', 'copilot_eta', 'copilot_budget'].includes(scenario.agent)) {
      errors.push('unknown copilot intent');
    }
  }
  return errors;
}

export function runEvaluationHarness() {
  const results = evaluationScenarios.map((s) => ({
    id: s.id,
    agent: s.agent,
    errors: validateScenarioConstraints(s),
    pass: validateScenarioConstraints(s).length === 0,
  }));
  const passed = results.filter((r) => r.pass).length;
  return { total: results.length, passed, failed: results.length - passed, results };
}
