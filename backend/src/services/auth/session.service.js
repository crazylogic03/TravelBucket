import crypto from 'crypto';
import { getPrisma } from '../../db/prisma.js';
import { config } from '../../config/env.js';

const SESSION_COOKIE = 'yolo_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const SESSION_TTL_SHORT_MS = 24 * 60 * 60 * 1000; // 1 day (no remember-me)

/**
 * @param {string} token
 * @returns {string}
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * @returns {string}
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * @param {string} value
 * @returns {string}
 */
export function hashIp(value) {
  if (!value) return null;
  return crypto
    .createHmac('sha256', config.sessionSecret || 'yolo')
    .update(value)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Create a server-side session for a user.
 * @param {{ userId: string, userAgent?: string, ip?: string, rememberMe?: boolean }} params
 * @returns {Promise<{ token: string, session: object, ttlMs: number }>}
 */
export async function createSession({ userId, userAgent, ip, rememberMe = true }) {
  const prisma = getPrisma();
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const ttlMs = rememberMe ? SESSION_TTL_MS : SESSION_TTL_SHORT_MS;
  const expiresAt = new Date(Date.now() + ttlMs);

  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: userAgent || null,
      ipHash: hashIp(ip),
    },
  });

  return { token, session, ttlMs };
}

/**
 * Validate a session token and return the user if valid.
 * @param {string} token
 * @returns {Promise<{ user: object, session: object } | null>}
 */
export async function validateSession(token) {
  if (!token) return null;

  const prisma = getPrisma();
  const tokenHash = hashToken(token);

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  await prisma.session
    .update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});

  return { user: session.user, session };
}

/**
 * Invalidate a session by token.
 * @param {string} token
 * @returns {Promise<void>}
 */
export async function invalidateSession(token) {
  if (!token) return;
  const prisma = getPrisma();
  const tokenHash = hashToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

/**
 * Invalidate all sessions for a user.
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function invalidateAllUserSessions(userId) {
  const prisma = getPrisma();
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * Cookie options for the session cookie.
 * @param {number} [ttlMs]
 * @returns {object}
 */
export function getSessionCookieOptions(ttlMs = SESSION_TTL_MS) {
  const isProduction = config.nodeEnv === 'production';
  return {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: Math.floor(ttlMs / 1000),
  };
}

export { SESSION_COOKIE, SESSION_TTL_MS, SESSION_TTL_SHORT_MS };
