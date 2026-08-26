import { getPrisma } from '../../db/prisma.js';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from './password.service.js';
import { publicUser } from './google.service.js';

/**
 * Register a new local user with hashed password.
 * @param {{ name: string, email: string, password: string }} input
 */
export async function registerLocalUser({ name, email, password }) {
  const prisma = getPrisma();
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();
  const trimmedName = String(name || '').trim();

  if (!trimmedName || trimmedName.length < 2) {
    const err = new Error('Full name is required');
    err.statusCode = 400;
    throw err;
  }
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    const err = new Error('A valid email is required');
    err.statusCode = 400;
    throw err;
  }

  const strength = validatePasswordStrength(password);
  if (!strength.ok) {
    const err = new Error(strength.message);
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    const err = new Error('An account with this email already exists. Try signing in.');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: trimmedName,
      passwordHash,
      settings: { create: {} },
    },
  });

  return user;
}

/**
 * Authenticate with email + password.
 * @param {{ email: string, password: string }} input
 */
export async function loginLocalUser({ email, password }) {
  const prisma = getPrisma();
  const normalizedEmail = String(email || '')
    .trim()
    .toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user || !user.passwordHash) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  return user;
}

/**
 * Change password for authenticated local user.
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (!user.passwordHash) {
    const err = new Error(
      'This account uses Google sign-in. Set a password after verifying ownership, or continue with Google.',
    );
    err.statusCode = 400;
    throw err;
  }

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) {
    const err = new Error('Current password is incorrect');
    err.statusCode = 401;
    throw err;
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.ok) {
    const err = new Error(strength.message);
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { ok: true };
}

/**
 * Update basic profile fields.
 */
export async function updateProfile(userId, { name, avatarUrl }) {
  const prisma = getPrisma();
  const data = {};
  if (name != null) {
    const trimmed = String(name).trim();
    if (trimmed.length < 2) {
      const err = new Error('Name must be at least 2 characters');
      err.statusCode = 400;
      throw err;
    }
    data.name = trimmed;
  }
  if (avatarUrl !== undefined) {
    data.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
  }

  const user = await prisma.user.update({ where: { id: userId }, data });
  return publicUser(user);
}

/**
 * Soft-delete account (hard delete for MVP — cascades via Prisma).
 */
export async function deleteAccount(userId) {
  const prisma = getPrisma();
  await prisma.user.delete({ where: { id: userId } });
  return { ok: true };
}
