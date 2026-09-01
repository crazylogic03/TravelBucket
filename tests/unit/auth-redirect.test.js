import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function isSafeRedirect(redirect) {
  if (!redirect || typeof redirect !== 'string') return false;
  if (!redirect.startsWith('/')) return false;
  if (redirect.startsWith('//')) return false;
  return true;
}

describe('session token hashing', () => {
  it('produces stable sha256 hashes', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
    expect(hashToken('abc')).not.toBe(hashToken('abcd'));
    expect(hashToken('abc')).toHaveLength(64);
  });
});

describe('safe redirect validation', () => {
  it('allows relative app paths', () => {
    expect(isSafeRedirect('/dashboard')).toBe(true);
    expect(isSafeRedirect('/trips/new/basics')).toBe(true);
  });

  it('rejects open redirects', () => {
    expect(isSafeRedirect('https://evil.com')).toBe(false);
    expect(isSafeRedirect('//evil.com')).toBe(false);
    expect(isSafeRedirect('')).toBe(false);
  });
});
