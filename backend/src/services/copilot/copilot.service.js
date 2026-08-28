import { getPrisma } from '../../db/prisma.js';
import { getOwnedTrip } from '../trips/trip.service.js';
import { runTravelCopilotAgent } from '../../ai/agents/travelCopilot.agent.js';

const QUICK_ACTIONS = {
  PLANNING: [
    { id: 'weather', label: 'Weather at destination', prompt: 'What is the weather like at my destination?' },
    { id: 'budget', label: 'Budget check', prompt: 'How is my budget looking so far?' },
    { id: 'itinerary', label: 'Review itinerary', prompt: 'Summarize my itinerary day by day.' },
    { id: 'food', label: 'Food near destination', prompt: 'Suggest restaurants near my destination.' },
  ],
  ACTIVE_TRIP: [
    { id: 'eta', label: 'ETA to next stop', prompt: 'What is my ETA to the next destination?' },
    { id: 'food', label: 'Food nearby', prompt: 'Find restaurants near my current location.' },
    { id: 'weather', label: 'Weather now', prompt: 'What is the weather at my current location?' },
    { id: 'budget', label: 'Budget status', prompt: 'Am I on track with my budget?' },
    { id: 'replan', label: 'Should I replan?', prompt: 'I am running late — should I replan the rest of my trip?' },
  ],
};

function buildTripContext(trip) {
  return {
    id: trip.id,
    title: trip.title,
    status: trip.status,
    start: trip.startLocationName,
    destination: trip.destinationName,
    budgetAmount: Number(trip.budgetAmount),
    currency: trip.currency,
    transportMode: trip.transportMode,
    numberOfDays: trip.numberOfDays,
    startDate: trip.startDate,
    endDate: trip.endDate,
  };
}

/**
 * Get or create chat session for trip + mode.
 */
export async function getOrCreateSession(tripId, userId, mode) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();

  let session = await prisma.chatSession.findFirst({
    where: { tripId, userId, mode },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 40 },
    },
  });

  if (!session) {
    session = await prisma.chatSession.create({
      data: { tripId, userId, mode },
      include: { messages: true },
    });
  }

  return session;
}

export async function getCopilotSession(tripId, userId, mode = 'PLANNING') {
  const session = await getOrCreateSession(tripId, userId, mode);
  return {
    sessionId: session.id,
    mode: session.mode,
    messages: session.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
    quickActions: QUICK_ACTIONS[mode] || QUICK_ACTIONS.PLANNING,
  };
}

export async function sendCopilotMessage({
  tripId,
  userId,
  message,
  mode = 'PLANNING',
  location,
}) {
  const trimmed = String(message || '').trim().slice(0, 2000);
  if (!trimmed) {
    const err = new Error('Message is required');
    err.statusCode = 400;
    throw err;
  }

  const trip = await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  const session = await getOrCreateSession(tripId, userId, mode);

  const history = session.messages.slice(-20).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  await prisma.chatMessage.create({
    data: {
      chatSessionId: session.id,
      role: 'USER',
      content: trimmed,
    },
  });

  const loc =
    location?.latitude != null && location?.longitude != null
      ? { latitude: Number(location.latitude), longitude: Number(location.longitude) }
      : trip.status === 'ACTIVE' && trip.destinationLatitude
        ? { latitude: trip.destinationLatitude, longitude: trip.destinationLongitude }
        : null;

  const { reply, toolCalls, toolResults, meta } = await runTravelCopilotAgent({
    userId,
    tripId,
    message: trimmed,
    history,
    location: loc,
    tripContext: buildTripContext(trip),
  });

  const assistant = await prisma.chatMessage.create({
    data: {
      chatSessionId: session.id,
      role: 'ASSISTANT',
      content: reply,
      toolCalls: toolCalls.length ? toolCalls : undefined,
      toolResults: toolResults.length ? toolResults : undefined,
    },
  });

  await prisma.chatSession.update({
    where: { id: session.id },
    data: { updatedAt: new Date() },
  });

  return {
    message: {
      id: assistant.id,
      role: 'ASSISTANT',
      content: reply,
      createdAt: assistant.createdAt,
    },
    meta,
  };
}

export async function clearCopilotSession(tripId, userId, mode) {
  await getOwnedTrip(tripId, userId);
  const prisma = getPrisma();
  const session = await prisma.chatSession.findFirst({
    where: { tripId, userId, mode },
    orderBy: { updatedAt: 'desc' },
  });
  if (session) {
    await prisma.chatMessage.deleteMany({ where: { chatSessionId: session.id } });
  }
  return { cleared: true };
}
