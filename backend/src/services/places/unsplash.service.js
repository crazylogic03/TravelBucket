import { config } from '../../config/env.js';

const TIMEOUT_MS = 8000;

/**
 * Search Unsplash for a travel image.
 * @param {string} query
 * @returns {Promise<string|null>}
 */
export async function fetchUnsplashImage(query) {
  if (!config.unsplashAccessKey || !query) return null;

  const url = new URL('https://api.unsplash.com/search/photos');
  url.searchParams.set('query', query);
  url.searchParams.set('per_page', '1');
  url.searchParams.set('orientation', 'landscape');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${config.unsplashAccessKey}` },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
