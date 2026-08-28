import { groqProvider } from '../providers/groqProvider.js';
import { COPILOT_SYSTEM_PROMPT } from '../prompts/copilot.prompt.js';
import { toolDefinitions, executeTool } from '../tools/index.js';

const MAX_TOOL_ITERATIONS = 5;

/**
 * Run copilot with tool-calling loop.
 */
export async function runTravelCopilotAgent({
  userId,
  tripId,
  message,
  history = [],
  location,
  tripContext,
}) {
  const messages = [
    { role: 'system', content: COPILOT_SYSTEM_PROMPT },
    {
      role: 'system',
      content: `Trip context:\n${JSON.stringify(tripContext, null, 2)}${
        location
          ? `\nUser location: lat ${location.latitude}, lng ${location.longitude}`
          : ''
      }`,
    },
    ...history.map((m) => ({
      role: m.role === 'ASSISTANT' ? 'assistant' : 'user',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  const toolCallsLog = [];
  const toolResultsLog = [];

  try {
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const result = await groqProvider.chat({
        agentType: 'TravelCopilotAgent',
        userId,
        tripId,
        tools: toolDefinitions,
        toolChoice: 'auto',
        temperature: 0.35,
        messages,
      });

      if (!result.toolCalls?.length) {
        return {
          reply: result.content || 'How can I help with your trip?',
          toolCalls: toolCallsLog,
          toolResults: toolResultsLog,
          meta: { model: result.model, latencyMs: result.latencyMs },
        };
      }

      messages.push({
        role: 'assistant',
        content: result.content || '',
        tool_calls: result.toolCalls,
      });

      for (const call of result.toolCalls) {
        const fn = call.function?.name;
        let args = {};
        try {
          args = JSON.parse(call.function?.arguments || '{}');
        } catch {
          args = {};
        }
        if (!args.tripId) args.tripId = tripId;

        const output = await executeTool(fn, args, { userId, tripId, location });
        toolCallsLog.push({ name: fn, arguments: args });
        toolResultsLog.push({ name: fn, result: output });

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(output),
        });
      }
    }

    const final = await groqProvider.chat({
      agentType: 'TravelCopilotAgent',
      userId,
      tripId,
      temperature: 0.35,
      messages,
    });

    return {
      reply: final.content || 'I gathered the data — let me know if you need anything else.',
      toolCalls: toolCallsLog,
      toolResults: toolResultsLog,
      meta: { model: final.model, latencyMs: final.latencyMs },
    };
  } catch {
    return buildFallbackReply({ message, tripContext, location });
  }
}

function buildFallbackReply({ message, tripContext, location }) {
  const lower = message.toLowerCase();
  let reply =
    'Copilot is in offline mode right now, but I can still help with basics from your trip data.';

  if (/weather/i.test(lower) && location) {
    reply = `I can't fetch live weather right now. Your trip is "${tripContext?.title || 'in progress'}". Try again shortly or check a weather app for your current coordinates.`;
  } else if (/food|restaurant|eat/i.test(lower)) {
    reply =
      'Restaurant search needs the AI service. Check your map for nearby options, or ask again when connectivity to Groq is restored.';
  } else if (/budget|spend|expense/i.test(lower)) {
    reply = `Your budget is ${tripContext?.currency || 'INR'} ${Number(tripContext?.budgetAmount || 0).toLocaleString()}. Open Expenses for the latest totals.`;
  } else if (/eta|how long|distance/i.test(lower)) {
    reply =
      'ETA and routing need the maps service. Open the live map tab to see navigation to your next stop.';
  } else if (/replan|skip|delay/i.test(lower)) {
    reply =
      'If you skipped or are running late, use Replan from the live trip screen to adjust remaining stops.';
  }

  return { reply, toolCalls: [], toolResults: [], meta: { fallback: true } };
}
