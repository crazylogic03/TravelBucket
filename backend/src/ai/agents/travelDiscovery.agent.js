import { groqProvider } from '../providers/groqProvider.js';
import { discoveryOutputSchema } from '../schemas/agent.schemas.js';
import { DISCOVERY_SYSTEM_PROMPT } from '../prompts/discovery.prompt.js';

export { DISCOVERY_SYSTEM_PROMPT };

/**
 * Rank and enrich destination candidates with AI.
 * Falls back to deterministic ranking if Groq is unavailable.
 * @param {{ trip: object, candidates: object[], userId?: string }} input
 */
export async function runTravelDiscoveryAgent({ trip, candidates, userId }) {
  const interests = trip.preference
    ? Object.entries(trip.preference)
        .filter(([_k, v]) => typeof v === 'boolean' && v)
        .map(([k]) => k)
    : [];

  if (!candidates.length) {
    return fallbackDiscovery([], interests);
  }

  const payload = {
    trip: {
      start: trip.startLocationName,
      destination: trip.destinationName,
      startDate: trip.startDate,
      endDate: trip.endDate,
      numberOfDays: trip.numberOfDays,
      travelerCount: trip.travelerCount,
      budgetAmount: Number(trip.budgetAmount),
      currency: trip.currency,
      transportMode: trip.transportMode,
      interests,
    },
    candidates: candidates.map((c) => ({
      name: c.name,
      fullName: c.fullName,
      latitude: c.latitude,
      longitude: c.longitude,
      distanceFromRouteKm: c.distanceFromRouteKm,
      categories: c.categories,
    })),
    outputSchema: {
      candidates: [
        {
          name: 'string',
          description: 'string',
          famousFor: 'string',
          bestTime: 'string',
          recommendedDurationMinutes: 'number',
          estimatedCost: 'number',
          routeRelevanceScore: '0-1',
          preferenceMatchScore: '0-1',
          recommendationReason: 'string',
          latitude: 'number',
          longitude: 'number',
        },
      ],
      summary: 'string',
    },
  };

  try {
    const result = await groqProvider.chat({
      agentType: 'TravelDiscoveryAgent',
      userId,
      tripId: trip.id,
      json: true,
      temperature: 0.3,
      messages: [
        { role: 'system', content: DISCOVERY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Rank and enrich these route candidates. Return JSON only.\n\n${JSON.stringify(payload)}`,
        },
      ],
    });

    let parsed;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      return fallbackDiscovery(candidates, interests);
    }

    const validated = discoveryOutputSchema.safeParse(parsed);
    if (!validated.success) {
      return fallbackDiscovery(candidates, interests);
    }

    const byName = new Map(candidates.map((c) => [c.name.toLowerCase(), c]));
    const merged = validated.data.candidates
      .map((c) => {
        const original = byName.get(c.name.toLowerCase());
        return {
          ...c,
          latitude: c.latitude ?? original?.latitude,
          longitude: c.longitude ?? original?.longitude,
        };
      })
      .filter((c) => c.latitude != null && c.longitude != null)
      .slice(0, 30);

    if (!merged.length) {
      return fallbackDiscovery(candidates, interests);
    }

    return {
      candidates: merged,
      summary:
        validated.data.summary || `Your AI found ${merged.length} places worth considering.`,
      meta: {
        model: result.model,
        latencyMs: result.latencyMs,
        keyPoolSlot: result.keyPoolSlot,
      },
    };
  } catch {
    return fallbackDiscovery(candidates, interests);
  }
}

function fallbackDiscovery(candidates, interests) {
  const list = candidates.slice(0, 30).map((c, i) => ({
    name: c.name,
    description: c.fullName || c.name,
    famousFor: (c.categories || []).slice(0, 3).join(', ') || null,
    bestTime: 'Daytime',
    recommendedDurationMinutes: 90,
    estimatedCost: 500,
    routeRelevanceScore: Math.max(0.4, 1 - i * 0.02),
    preferenceMatchScore: interests.length ? 0.6 : 0.5,
    recommendationReason: 'Selected as a feasible stop along your route.',
    latitude: c.latitude,
    longitude: c.longitude,
  }));

  return {
    candidates: list,
    summary: `Found ${list.length} places worth considering along your route.`,
    meta: { fallback: true },
  };
}
