# AI Evaluation

YOLO uses **120 synthetic trip scenarios** in `tests/ai-evaluation/scenarios.js` to validate constraint rules without calling Groq on every CI run.

## Scenario dimensions

| Dimension | Values |
|-----------|--------|
| Agents | discovery, optimize, copilot (weather/food/ETA/budget), replan (skip/delay), summary |
| Regions | Delhi→Manali, Mumbai→Goa, Bangalore→Ooty, Chennai→Pondicherry, Kolkata→Darjeeling |
| Transport | CAR, TRAIN, FLIGHT, BUS, BIKE |
| Trip length | 2–6 days |
| Budget | ₹15k–₹60k |

## Constraint checks (automated)

Each scenario must satisfy:

- **Positive budget** — no zero/negative budgets
- **Feasible day count** — at least 1 day
- **Tool grounding** — copilot intents map to registered tools (`get_weather`, `search_restaurants`, `get_eta`, `calculate_budget_status`)
- **Progress math** — skipped destinations ≠ visited (see `calculateProgress`)
- **No invented live data** — agents fall back honestly when Groq/maps unavailable

## Running evaluation

```bash
npm test -- tests/unit/ai-evaluation.test.js
npm test -- tests/unit/copilot-replan.test.js
```

## Manual spot checks (recommended)

1. **Discovery** — Delhi→Manali, 3 days, nature+food preferences → candidates on route
2. **Optimizer** — 4 selected stops, 3 days → no overlapping activity times
3. **Copilot (planning)** — “What's the weather at my destination?” → uses `get_weather` tool
4. **Copilot (live)** — with GPS → “Find restaurants nearby” → `search_restaurants`
5. **Replan** — skip a stop during active trip → preview diff → apply → itinerary updated
6. **Summary** — complete trip → narrative mentions visited/skipped/spend vs budget only

## Security notes (M19)

- Copilot messages capped at **2000 characters**
- All copilot/replan/summary routes require **session auth**
- Groq keys only via **key pool** on server; never exposed to frontend
- Rate limit: **300 req/min** globally (Fastify `@fastify/rate-limit`)

## Observability

Every Groq call logs an `AiRun` row: agent type, model, latency, token counts, status (`SUCCESS` / `FALLBACK` / `FAILED`).
