import { POPULAR_DESTINATIONS, EXPLORE_VIBES } from '../../data/popularDestinations.js';
import { fetchUnsplashImage } from './unsplash.service.js';
import { config } from '../../config/env.js';

async function resolveImage(item) {
  if (config.unsplashAccessKey && item.imageQuery) {
    try {
      const fresh = await fetchUnsplashImage(item.imageQuery);
      if (fresh) return fresh;
    } catch {
      /* use curated CDN URL */
    }
  }
  return item.image || null;
}

/**
 * Popular destinations for Explore + Dashboard discovery.
 */
export async function getPopularDestinations() {
  const destinations = await Promise.all(
    POPULAR_DESTINATIONS.map(async (d) => ({
      id: d.id,
      name: d.name,
      region: d.region,
      category: d.category,
      vibe: d.vibe,
      rating: d.rating,
      visits: d.visits,
      description: d.description,
      imageUrl: await resolveImage(d),
    })),
  );
  return destinations;
}

/**
 * Browse-by-vibe tiles for Explore.
 */
export async function getExploreVibes() {
  const vibes = await Promise.all(
    EXPLORE_VIBES.map(async (v) => ({
      id: v.id,
      label: v.label,
      vibe: v.vibe,
      imageUrl: await resolveImage(v),
    })),
  );
  return vibes;
}
