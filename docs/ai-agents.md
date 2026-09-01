# AI Agents

## Implemented (Milestones 7–9)

| Agent | File | Role |
|-------|------|------|
| TravelDiscoveryAgent | `backend/src/ai/agents/travelDiscovery.agent.js` | Rank/enrich route candidates |
| TripOptimizerAgent | `backend/src/ai/agents/tripOptimizer.agent.js` | Build feasible day itinerary |

## Infrastructure

- `GroqKeyPool` — multi-key rotation, cooldown, health
- `GroqProvider` — provider abstraction + AiRun logging
- Zod schemas in `backend/src/ai/schemas/agent.schemas.js`
- Deterministic tools in `backend/src/ai/tools/index.js`

## Fallbacks

If Groq is unavailable or returns invalid JSON, discovery and optimizer use deterministic fallbacks so trip data is preserved.
