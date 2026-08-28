/** Curated travel photography — Unsplash CDN, no API key required in frontend */

export const HERO_TRAVELER =
  'https://images.unsplash.com/photo-1526779255197-a041ee20a0ad?auto=format&fit=crop&w=1920&q=80';

export const HERO_BACKPACK =
  'https://images.unsplash.com/photo-1488646953015-81975fd12eb1?auto=format&fit=crop&w=1920&q=80';

export const HERO_COUPLE =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1920&q=80';

export const HERO_FRIENDS =
  'https://images.unsplash.com/photo-1539635278303-d8912e69b886?auto=format&fit=crop&w=1920&q=80';

export const HERO_VIEWPOINT =
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1920&q=80';

export const HERO_MAP =
  'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1920&q=80';

export const EMPTY_JOURNEY =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80';

export const FOOTER_BG =
  'https://images.unsplash.com/photo-1476514525535-07fb3f4a4315?auto=format&fit=crop&w=1920&q=80';

/** Popular / discovery destinations for dashboard & explore */
export const POPULAR_DESTINATIONS = [
  {
    id: 'goa',
    name: 'Goa',
    region: 'India',
    category: 'Beaches',
    rating: 4.8,
    visits: '12k+',
    distance: '480 km',
    description: 'Sun, sand, and coastal culture.',
    image:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    accent: 'teal',
  },
  {
    id: 'pune',
    name: 'Pune',
    region: 'Maharashtra',
    category: 'Cities',
    rating: 4.6,
    visits: '8k+',
    distance: '650 km',
    description: 'History, food, and hill escapes nearby.',
    image:
      'https://images.unsplash.com/photo-1587474267264-086392a9f749?auto=format&fit=crop&w=800&h=600&q=80',
    accent: 'coral',
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    region: 'Rajasthan',
    category: 'Heritage',
    rating: 4.9,
    visits: '15k+',
    distance: '280 km',
    description: 'Palaces, bazaars, and pink-city charm.',
    image:
      'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=80',
    accent: 'sunset',
  },
  {
    id: 'manali',
    name: 'Manali',
    region: 'Himachal',
    category: 'Mountains',
    rating: 4.7,
    visits: '9k+',
    distance: '540 km',
    description: 'Alpine trails and adventure sports.',
    image:
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80',
    accent: 'green',
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    region: 'Maharashtra',
    category: 'Cities',
    rating: 4.5,
    visits: '20k+',
    distance: '720 km',
    description: 'Coastline, street food, and nightlife.',
    image:
      'https://images.unsplash.com/photo-1566552881562-4172d7f6d42c?auto=format&fit=crop&w=800&q=80',
    accent: 'ocean',
  },
  {
    id: 'kerala',
    name: 'Kerala Backwaters',
    region: 'India',
    category: 'Nature',
    rating: 4.9,
    visits: '11k+',
    distance: '900 km',
    description: 'Houseboats and lush green waterways.',
    image:
      'https://images.unsplash.com/photo-1602216058766-b3a54ae1f937?auto=format&fit=crop&w=800&q=80',
    accent: 'teal',
  },
];

export const EXPLORE_CATEGORIES = [
  {
    id: 'india',
    label: 'India',
    image:
      'https://images.unsplash.com/photo-1524492412937-b28c0f9d2296?auto=format&fit=crop&w=800&q=80',
    size: 'large',
  },
  {
    id: 'beaches',
    label: 'Beaches',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    size: 'medium',
  },
  {
    id: 'mountains',
    label: 'Mountains',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    size: 'medium',
  },
  {
    id: 'cities',
    label: 'Cities',
    image:
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'adventure',
    label: 'Adventure',
    image:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80',
    size: 'small',
  },
  {
    id: 'food',
    label: 'Food & Culture',
    image:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    size: 'large',
  },
];

/** Pick hero image from destination name (simple hash) */
export function destinationHeroImage(name) {
  if (!name) return HERO_BACKPACK;
  const n = name.toLowerCase();
  if (n.includes('goa') || n.includes('beach')) return POPULAR_DESTINATIONS[0].image;
  if (n.includes('pune')) return POPULAR_DESTINATIONS[1].image;
  if (n.includes('jaipur') || n.includes('rajasthan')) return POPULAR_DESTINATIONS[2].image;
  if (n.includes('manali') || n.includes('hill')) return POPULAR_DESTINATIONS[3].image;
  if (n.includes('mumbai') || n.includes('bombay')) return POPULAR_DESTINATIONS[4].image;
  if (n.includes('kerala') || n.includes('backwater')) return POPULAR_DESTINATIONS[5].image;
  return HERO_VIEWPOINT;
}

export const TRANSPORT_ICONS = {
  FLIGHT: '✈️',
  TRAIN: '🚆',
  BUS: '🚌',
  CAR: '🚗',
  BIKE: '🏍️',
};
