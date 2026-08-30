import { apiFetch } from '@/services/api.js';

export function getCopilotSession(tripId, mode = 'PLANNING') {
  const q = mode === 'ACTIVE_TRIP' ? '?mode=ACTIVE_TRIP' : '';
  return apiFetch(`/api/trips/${tripId}/copilot${q}`);
}

export function sendCopilotMessage(tripId, payload) {
  return apiFetch(`/api/trips/${tripId}/copilot/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function clearCopilotSession(tripId, mode = 'PLANNING') {
  const q = mode === 'ACTIVE_TRIP' ? '?mode=ACTIVE_TRIP' : '';
  return apiFetch(`/api/trips/${tripId}/copilot${q}`, { method: 'DELETE' });
}

export function previewReplan(tripId, reason) {
  return apiFetch(`/api/trips/${tripId}/replan/preview`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function applyReplan(tripId, reason) {
  return apiFetch(`/api/trips/${tripId}/replan/apply`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function getTripSummary(tripId) {
  return apiFetch(`/api/trips/${tripId}/summary`);
}

export function completeTripWithSummary(tripId) {
  return apiFetch(`/api/trips/${tripId}/summary/complete`, { method: 'POST' });
}
