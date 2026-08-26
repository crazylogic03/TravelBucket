import { OAuth2Client } from 'google-auth-library';
import { config } from '../../config/env.js';
import { getPrisma } from '../../db/prisma.js';

/**
 * @returns {OAuth2Client}
 */
export function createGoogleOAuthClient() {
  return new OAuth2Client(
    config.googleClientId,
    config.googleClientSecret,
    config.googleRedirectUri,
  );
}

/**
 * Build the Google OAuth authorization URL.
 * @param {string} state
 * @returns {string}
 */
export function getGoogleAuthUrl(state) {
  const client = createGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'select_account',
    scope: ['openid', 'email', 'profile'],
    state,
  });
}

/**
 * Exchange authorization code for profile and upsert User.
 * @param {string} code
 * @returns {Promise<object>} User record
 */
export async function authenticateWithGoogleCode(code) {
  const client = createGoogleOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    const err = new Error('Invalid Google identity token');
    err.statusCode = 401;
    throw err;
  }

  const prisma = getPrisma();
  const email = payload.email.toLowerCase();

  const byGoogle = await prisma.user.findUnique({ where: { googleId: payload.sub } });
  if (byGoogle) {
    return prisma.user.update({
      where: { id: byGoogle.id },
      data: {
        email,
        name: payload.name || byGoogle.name || email,
        avatarUrl: payload.picture || byGoogle.avatarUrl,
      },
    });
  }

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    // Link Google identity to an existing local account with the same email
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        googleId: payload.sub,
        name: byEmail.name || payload.name || email,
        avatarUrl: byEmail.avatarUrl || payload.picture || null,
      },
    });
  }

  return prisma.user.create({
    data: {
      googleId: payload.sub,
      email,
      name: payload.name || email,
      avatarUrl: payload.picture || null,
      settings: { create: {} },
    },
  });
}

/**
 * Serialize a user for API responses (never expose password hashes).
 * @param {object} user
 */
export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    hasPassword: Boolean(user.passwordHash),
    hasGoogle: Boolean(user.googleId),
  };
}
