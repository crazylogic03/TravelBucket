import { apiFetch } from '@/services/api.js';

export function getPopularDestinations() {
  return apiFetch('/api/places/popular');
}

export function getExploreVibes() {
  return apiFetch('/api/places/vibes');
}
