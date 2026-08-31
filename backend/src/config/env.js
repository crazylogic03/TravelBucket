import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load repo-root .env for local dev; cloud hosts inject env vars directly.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * @typedef {Object} AppConfig
 * @property {string} nodeEnv
 * @property {number} port
 * @property {string} frontendUrl
 * @property {string} sessionSecret
 * @property {string} databaseUrl
 * @property {string} googleClientId
 * @property {string} googleClientSecret
 * @property {string} googleRedirectUri
 * @property {string} mapboxAccessToken
 * @property {string} openWeatherApiKey
 * @property {string} unsplashAccessKey
 * @property {string[]} groqApiKeys
 * @property {string} razorpayKeyId
 * @property {string} razorpayKeySecret
 */

/** @returns {AppConfig} */
export function loadConfig() {
  const groqApiKeys = [1, 2, 3, 4, 5]
    .map((n) => process.env[`GROQ_API_KEY_${n}`])
    .filter(Boolean);

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const port = Number(process.env.PORT) || 3001;

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port,
    frontendUrl,
    sessionSecret: process.env.SESSION_SECRET || '',
    databaseUrl: process.env.DATABASE_URL || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    googleRedirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      (process.env.NODE_ENV === 'production'
        ? ''
        : `http://localhost:${port}/api/auth/google/callback`),
    mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN || '',
    openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '',
    unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY || '',
    groqApiKeys,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  };
}

/**
 * Fail fast in production when required infrastructure env vars are missing.
 * @param {AppConfig} cfg
 */
export function validateConfig(cfg) {
  if (cfg.nodeEnv !== 'production') return;

  const missing = [];
  if (!cfg.databaseUrl) missing.push('DATABASE_URL');
  if (!cfg.frontendUrl) missing.push('FRONTEND_URL');
  if (!cfg.sessionSecret) missing.push('SESSION_SECRET');

  if (missing.length) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(', ')}`,
    );
  }

  if (cfg.sessionSecret.length < 16) {
    throw new Error('SESSION_SECRET must be at least 16 characters in production');
  }
}

export const config = loadConfig();
