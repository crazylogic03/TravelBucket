import { config } from '../../config/env.js';

const TIMEOUT_MS = 8000;

/**
 * Fetch current weather for coordinates.
 * @param {number} lat
 * @param {number} lng
 */
export async function getWeather(lat, lng) {
  if (!config.openWeatherApiKey) {
    const err = new Error('Weather unavailable');
    err.statusCode = 503;
    throw err;
  }

  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('units', 'metric');
  url.searchParams.set('appid', config.openWeatherApiKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      const err = new Error('Weather unavailable');
      err.statusCode = 502;
      throw err;
    }
    const data = await res.json();
    return {
      temp: Math.round(data.main?.temp ?? 0),
      feelsLike: Math.round(data.main?.feels_like ?? 0),
      humidity: data.main?.humidity ?? null,
      condition: data.weather?.[0]?.main || 'Unknown',
      description: data.weather?.[0]?.description || 'Weather unavailable',
      icon: data.weather?.[0]?.icon
        ? `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
        : null,
      windSpeed: data.wind?.speed ?? null,
    };
  } finally {
    clearTimeout(timer);
  }
}
