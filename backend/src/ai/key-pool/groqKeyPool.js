import { config } from '../../config/env.js';

/**
 * @typedef {Object} KeySlot
 * @property {number} slot
 * @property {string} key
 * @property {'healthy'|'cooldown'|'disabled'} status
 * @property {number|null} cooldownUntil
 * @property {number} successCount
 * @property {number} failureCount
 * @property {number} lastUsedAt
 */

const DEFAULT_COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 3;

/**
 * Multi-key Groq pool with health tracking and rotation.
 */
export class GroqKeyPool {
  constructor(keys = config.groqApiKeys, cooldownMs = DEFAULT_COOLDOWN_MS) {
    /** @type {KeySlot[]} */
    this.slots = (keys || [])
      .filter(Boolean)
      .map((key, index) => ({
        slot: index + 1,
        key,
        status: 'healthy',
        cooldownUntil: null,
        successCount: 0,
        failureCount: 0,
        lastUsedAt: 0,
      }));
    this.cooldownMs = cooldownMs;
    this.maxAttempts = Math.min(MAX_ATTEMPTS, Math.max(1, this.slots.length));
  }

  /** Restore keys whose cooldown expired. */
  refresh() {
    const now = Date.now();
    for (const slot of this.slots) {
      if (slot.status === 'cooldown' && slot.cooldownUntil && slot.cooldownUntil <= now) {
        slot.status = 'healthy';
        slot.cooldownUntil = null;
      }
    }
  }

  /**
   * @returns {KeySlot|null}
   */
  selectHealthyKey() {
    this.refresh();
    const healthy = this.slots.filter((s) => s.status === 'healthy');
    if (!healthy.length) return null;
    healthy.sort((a, b) => a.lastUsedAt - b.lastUsedAt);
    return healthy[0];
  }

  /** @param {KeySlot} slot */
  markSuccess(slot) {
    slot.successCount += 1;
    slot.lastUsedAt = Date.now();
    slot.status = 'healthy';
    slot.cooldownUntil = null;
  }

  /**
   * @param {KeySlot} slot
   * @param {{ rateLimited?: boolean }} [meta]
   */
  markFailure(slot, meta = {}) {
    slot.failureCount += 1;
    slot.lastUsedAt = Date.now();
    slot.status = 'cooldown';
    const cooldown = meta.rateLimited ? this.cooldownMs * 2 : this.cooldownMs;
    slot.cooldownUntil = Date.now() + cooldown;
  }

  getHealth() {
    this.refresh();
    return this.slots.map((s) => ({
      slot: s.slot,
      status: s.status,
      cooldownUntil: s.cooldownUntil,
      successCount: s.successCount,
      failureCount: s.failureCount,
    }));
  }

  hasKeys() {
    return this.slots.length > 0;
  }
}

/** Singleton pool */
export const groqKeyPool = new GroqKeyPool();
