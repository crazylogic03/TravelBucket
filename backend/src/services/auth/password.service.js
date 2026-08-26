import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getPrisma } from '../../db/prisma.js';
import { config } from '../../config/env.js';
import { hashToken } from './session.service.js';

const BCRYPT_ROUNDS = 12;
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * @param {string} password
 * @param {string} passwordHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, passwordHash) {
  if (!password || !passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}

/**
 * Validate password strength for signup / change.
 * @param {string} password
 * @returns {{ ok: boolean, message?: string, score: number }}
 */
export function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return { ok: false, score: 0, message: 'Password must be at least 8 characters' };
  }
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score < 3) {
    return {
      ok: false,
      score,
      message: 'Use upper & lower case letters, a number, and preferably a symbol',
    };
  }
  return { ok: true, score };
}

/**
 * Create a password-reset token. Returns raw token for email/dev fallback.
 * Never returns or logs the user's password.
 * @param {string} email
 * @returns {Promise<{ created: boolean, emailSent: boolean, resetUrl?: string, message: string }>}
 */
export async function createPasswordResetToken(email) {
  const prisma = getPrisma();
  const normalized = String(email || '')
    .trim()
    .toLowerCase();

  const generic = {
    created: true,
    emailSent: false,
    message:
      'If an account exists for that email, password reset instructions have been prepared.',
  };

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || !user.passwordHash) {
    // Do not reveal whether the account exists or uses Google-only auth
    return generic;
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;

  // Email infrastructure not configured — return URL in development only
  const emailConfigured = Boolean(process.env.SMTP_HOST || process.env.EMAIL_FROM);
  if (emailConfigured) {
    // Abstraction point for future mailer integration
    return {
      ...generic,
      emailSent: false,
      message:
        'Password reset prepared, but email delivery is not fully configured. Contact support.',
    };
  }

  if (config.nodeEnv === 'production') {
    return {
      ...generic,
      message:
        'If an account exists, a reset link will be emailed when delivery is configured. Contact support if you need help.',
    };
  }

  return {
    created: true,
    emailSent: false,
    resetUrl,
    message:
      'Email delivery is not configured. Use the development reset link below to set a new password.',
  };
}

/**
 * @param {string} rawToken
 * @param {string} newPassword
 */
export async function resetPasswordWithToken(rawToken, newPassword) {
  const strength = validatePasswordStrength(newPassword);
  if (!strength.ok) {
    const err = new Error(strength.message);
    err.statusCode = 400;
    throw err;
  }

  const prisma = getPrisma();
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    const err = new Error('Reset link is invalid or expired');
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { ok: true };
}
