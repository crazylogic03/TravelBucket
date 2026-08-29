import { apiFetch } from '@/services/api.js';

export function listTrips() {
  return apiFetch('/api/trips');
}

export function getTrip(tripId) {
  return apiFetch(`/api/trips/${tripId}`);
}

export function getDraftTrip() {
  return apiFetch('/api/trips/draft');
}

export function createTrip(payload) {
  return apiFetch('/api/trips', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateTripBasics(tripId, payload) {
  return apiFetch(`/api/trips/${tripId}/basics`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateTripTransport(tripId, payload) {
  return apiFetch(`/api/trips/${tripId}/transport`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function confirmBooking(tripId, payload) {
  return apiFetch(`/api/trips/${tripId}/bookings`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function saveStayStep(tripId, payload) {
  return apiFetch(`/api/trips/${tripId}/stay`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function geocode(query) {
  return apiFetch(`/api/maps/geocode?q=${encodeURIComponent(query)}`);
}

export function getDirections(fromLng, fromLat, toLng, toLat) {
  const q = new URLSearchParams({
    fromLng: String(fromLng),
    fromLat: String(fromLat),
    toLng: String(toLng),
    toLat: String(toLat),
  });
  return apiFetch(`/api/maps/directions?${q}`);
}

export function getWeather(lat, lng) {
  return apiFetch(`/api/weather?lat=${lat}&lng=${lng}`);
}

export function discoverDestinations(tripId) {
  return apiFetch(`/api/trips/${tripId}/discover`, { method: 'POST' });
}

export function getRouteSuggestions(payload) {
  return apiFetch('/api/places/route-suggestions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function addRouteStops(tripId, stops) {
  return apiFetch(`/api/trips/${tripId}/route-stops`, {
    method: 'POST',
    body: JSON.stringify({ stops }),
  });
}

export function listDestinations(tripId) {
  return apiFetch(`/api/trips/${tripId}/destinations`);
}

export function updateDestination(tripId, destinationId, payload) {
  return apiFetch(`/api/trips/${tripId}/destinations/${destinationId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function reorderDestinations(tripId, orderedIds) {
  return apiFetch(`/api/trips/${tripId}/destinations/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ orderedIds }),
  });
}

export function optimizeTrip(tripId) {
  return apiFetch(`/api/trips/${tripId}/optimize`, { method: 'POST' });
}

export function finalizeTrip(tripId) {
  return apiFetch(`/api/trips/${tripId}/finalize`, { method: 'POST' });
}

export function getItinerary(tripId) {
  return apiFetch(`/api/trips/${tripId}/itinerary`);
}

export function getMapToken() {
  return apiFetch('/api/maps/token');
}

export function startTrip(tripId) {
  return apiFetch(`/api/trips/${tripId}/start`, { method: 'POST' });
}

export function completeTrip(tripId) {
  return apiFetch(`/api/trips/${tripId}/complete`, { method: 'POST' });
}

export function getLiveTrip(tripId) {
  return apiFetch(`/api/trips/${tripId}/live`);
}

export function visitDestination(tripId, destinationId) {
  return apiFetch(`/api/trips/${tripId}/destinations/${destinationId}/visit`, {
    method: 'POST',
  });
}

export function skipDestination(tripId, destinationId, reason) {
  return apiFetch(`/api/trips/${tripId}/destinations/${destinationId}/skip`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function listExpenses(tripId) {
  return apiFetch(`/api/trips/${tripId}/expenses`);
}

export function addExpense(tripId, payload) {
  return apiFetch(`/api/trips/${tripId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateExpense(tripId, expenseId, payload) {
  return apiFetch(`/api/trips/${tripId}/expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(tripId, expenseId) {
  return apiFetch(`/api/trips/${tripId}/expenses/${expenseId}`, {
    method: 'DELETE',
  });
}

export function getBudgetAnalysis(tripId) {
  return apiFetch(`/api/trips/${tripId}/budget`);
}

export function createConciergeOrder(tripId) {
  return apiFetch(`/api/trips/${tripId}/payments/concierge/order`, { method: 'POST' });
}

export function verifyConciergePayment(tripId, payload) {
  return apiFetch(`/api/trips/${tripId}/payments/concierge/verify`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listPayments(tripId) {
  return apiFetch(`/api/trips/${tripId}/payments`);
}
