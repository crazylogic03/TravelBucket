import crypto from 'crypto';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware.js';
import {
  SESSION_COOKIE,
  createSession,
  invalidateSession,
  invalidateAllUserSessions,
  getSessionCookieOptions,
  hashToken,
} from '../../services/auth/session.service.js';
import {
  getGoogleAuthUrl,
  authenticateWithGoogleCode,
  publicUser,
} from '../../services/auth/google.service.js';
import { registerLocalUser, loginLocalUser, changePassword, updateProfile, deleteAccount } from '../../services/auth/local.service.js';
import {
  createPasswordResetToken,
  resetPasswordWithToken,
  validatePasswordStrength,
} from '../../services/auth/password.service.js';
import { getOrCreateSettings, updateSettings } from '../../services/auth/settings.service.js';
import { getProfileStats, listUserSessions } from '../../services/auth/profile.service.js';
import { config } from '../../config/env.js';

const OAUTH_STATE_COOKIE = 'yolo_oauth_state';

/**
 * @param {string} redirect
 * @returns {boolean}
 */
function isSafeRedirect(redirect) {
  if (!redirect || typeof redirect !== 'string') return false;
  if (!redirect.startsWith('/')) return false;
  if (redirect.startsWith('//')) return false;
  return true;
}

function setSessionCookie(reply, token, ttlMs) {
  reply.setCookie(SESSION_COOKIE, token, getSessionCookieOptions(ttlMs));
}

/** @param {import('fastify').FastifyInstance} app */
export default async function authRoutes(app) {
  app.get('/auth/me', { preHandler: [optionalAuth] }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Not authenticated', user: null });
    }
    return { user: publicUser(request.user) };
  });

  app.post('/auth/signup', async (request, reply) => {
    const { name, email, password, confirmPassword, rememberMe = true } = request.body || {};
    if (password !== confirmPassword) {
      return reply.status(400).send({ error: 'Passwords do not match' });
    }
    try {
      const user = await registerLocalUser({ name, email, password });
      const { token, ttlMs } = await createSession({
        userId: user.id,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        rememberMe: Boolean(rememberMe),
      });
      setSessionCookie(reply, token, ttlMs);
      return reply.status(201).send({ user: publicUser(user) });
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/auth/login', async (request, reply) => {
    const { email, password, rememberMe = true } = request.body || {};
    try {
      const user = await loginLocalUser({ email, password });
      const { token, ttlMs } = await createSession({
        userId: user.id,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        rememberMe: Boolean(rememberMe),
      });
      setSessionCookie(reply, token, ttlMs);
      return { user: publicUser(user) };
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/auth/forgot-password', async (request, reply) => {
    const { email } = request.body || {};
    if (!email) {
      return reply.status(400).send({ error: 'Email is required' });
    }
    try {
      const result = await createPasswordResetToken(email);
      return result;
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/auth/reset-password', async (request, reply) => {
    const { token, password, confirmPassword } = request.body || {};
    if (!token) {
      return reply.status(400).send({ error: 'Reset token is required' });
    }
    if (password !== confirmPassword) {
      return reply.status(400).send({ error: 'Passwords do not match' });
    }
    try {
      await resetPasswordWithToken(token, password);
      return { ok: true, message: 'Password updated. You can sign in with your new password.' };
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/auth/password-strength', async (request) => {
    const { password } = request.body || {};
    return validatePasswordStrength(password || '');
  });

  app.get('/auth/google', async (request, reply) => {
    const redirect = isSafeRedirect(request.query.redirect)
      ? request.query.redirect
      : '/dashboard';

    const state = crypto.randomBytes(16).toString('hex');
    const statePayload = Buffer.from(JSON.stringify({ state, redirect })).toString('base64url');

    reply.setCookie(OAUTH_STATE_COOKIE, statePayload, {
      ...getSessionCookieOptions(),
      maxAge: 600,
      httpOnly: true,
    });

    const url = getGoogleAuthUrl(statePayload);
    return reply.redirect(url);
  });

  app.get('/auth/google/callback', async (request, reply) => {
    const { code, state, error } = request.query;

    if (error) {
      return reply.redirect(
        `${config.frontendUrl}/login?error=${encodeURIComponent(String(error))}`,
      );
    }

    const stored = request.cookies?.[OAUTH_STATE_COOKIE];
    reply.clearCookie(OAUTH_STATE_COOKIE, { path: '/' });

    if (!code || !state || !stored || state !== stored) {
      return reply.redirect(`${config.frontendUrl}/login?error=invalid_oauth_state`);
    }

    let redirect = '/dashboard';
    try {
      const parsed = JSON.parse(Buffer.from(stored, 'base64url').toString('utf8'));
      if (isSafeRedirect(parsed.redirect)) redirect = parsed.redirect;
    } catch {
      // keep default
    }

    // Always land on dashboard after OAuth (ignore trip-creation redirects)
    if (redirect.startsWith('/trips/new')) {
      redirect = '/dashboard';
    }

    try {
      const user = await authenticateWithGoogleCode(code);
      const { token, ttlMs } = await createSession({
        userId: user.id,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        rememberMe: true,
      });

      setSessionCookie(reply, token, ttlMs);
      return reply.redirect(`${config.frontendUrl}${redirect}`);
    } catch (err) {
      request.log.error(err);
      return reply.redirect(`${config.frontendUrl}/login?error=auth_failed`);
    }
  });

  app.post('/auth/logout', { preHandler: [optionalAuth] }, async (request, reply) => {
    const token = request.cookies?.[SESSION_COOKIE];
    await invalidateSession(token);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.get('/auth/profile', { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      return await getProfileStats(request.user.id);
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.patch('/auth/profile', { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const user = await updateProfile(request.user.id, request.body || {});
      return { user };
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.get('/auth/settings', { preHandler: [requireAuth] }, async (request) => {
    const settings = await getOrCreateSettings(request.user.id);
    return { settings };
  });

  app.patch('/auth/settings', { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      const settings = await updateSettings(request.user.id, request.body || {});
      return { settings };
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.post('/auth/change-password', { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      await changePassword(request.user.id, request.body || {});
      return { ok: true, message: 'Password updated' };
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });

  app.get('/auth/sessions', { preHandler: [requireAuth] }, async (request) => {
    const raw = request.cookies?.[SESSION_COOKIE];
    const currentHash = raw ? hashToken(raw) : null;
    const sessions = await listUserSessions(request.user.id, currentHash);
    return { sessions };
  });

  app.post('/auth/sessions/revoke-all', { preHandler: [requireAuth] }, async (request, reply) => {
    await invalidateAllUserSessions(request.user.id);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  });

  app.delete('/auth/account', { preHandler: [requireAuth] }, async (request, reply) => {
    try {
      await deleteAccount(request.user.id);
      reply.clearCookie(SESSION_COOKIE, { path: '/' });
      return { ok: true };
    } catch (err) {
      return reply.status(err.statusCode || 500).send({ error: err.message });
    }
  });
}
