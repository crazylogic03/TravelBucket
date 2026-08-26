import { getPrisma } from '../../db/prisma.js';

const DEFAULT_SETTINGS = {
  currency: 'INR',
  distanceUnit: 'km',
  timeFormat: '24h',
  preferredTransport: null,
  typicalTripLengthDays: null,
  preferredBudgetMin: null,
  preferredBudgetMax: null,
  travelInterests: [],
  notifyTripReminders: true,
  notifyBudgetAlerts: true,
  notifyAiUpdates: true,
  notifyTravelAlerts: true,
  aiPersonalization: true,
  aiRecommendationStyle: 'balanced',
  theme: 'system',
};

/**
 * Ensure settings row exists and return it.
 */
export async function getOrCreateSettings(userId) {
  const prisma = getPrisma();
  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { userId },
    });
  }
  return serializeSettings(settings);
}

/**
 * Persist settings updates. Only known fields are accepted.
 */
export async function updateSettings(userId, patch = {}) {
  await getOrCreateSettings(userId);
  const prisma = getPrisma();

  const data = {};
  if (patch.currency != null) data.currency = String(patch.currency).slice(0, 8);
  if (patch.distanceUnit != null) {
    data.distanceUnit = ['km', 'mi'].includes(patch.distanceUnit) ? patch.distanceUnit : 'km';
  }
  if (patch.timeFormat != null) {
    data.timeFormat = ['12h', '24h'].includes(patch.timeFormat) ? patch.timeFormat : '24h';
  }
  if (patch.preferredTransport !== undefined) {
    data.preferredTransport = patch.preferredTransport
      ? String(patch.preferredTransport).slice(0, 32)
      : null;
  }
  if (patch.typicalTripLengthDays !== undefined) {
    const n = Number(patch.typicalTripLengthDays);
    data.typicalTripLengthDays = Number.isFinite(n) && n > 0 ? Math.min(60, Math.round(n)) : null;
  }
  if (patch.preferredBudgetMin !== undefined) {
    data.preferredBudgetMin =
      patch.preferredBudgetMin == null ? null : Number(patch.preferredBudgetMin);
  }
  if (patch.preferredBudgetMax !== undefined) {
    data.preferredBudgetMax =
      patch.preferredBudgetMax == null ? null : Number(patch.preferredBudgetMax);
  }
  if (patch.travelInterests !== undefined) {
    data.travelInterests = Array.isArray(patch.travelInterests)
      ? patch.travelInterests.slice(0, 20)
      : [];
  }
  if (typeof patch.notifyTripReminders === 'boolean') {
    data.notifyTripReminders = patch.notifyTripReminders;
  }
  if (typeof patch.notifyBudgetAlerts === 'boolean') {
    data.notifyBudgetAlerts = patch.notifyBudgetAlerts;
  }
  if (typeof patch.notifyAiUpdates === 'boolean') {
    data.notifyAiUpdates = patch.notifyAiUpdates;
  }
  if (typeof patch.notifyTravelAlerts === 'boolean') {
    data.notifyTravelAlerts = patch.notifyTravelAlerts;
  }
  if (typeof patch.aiPersonalization === 'boolean') {
    data.aiPersonalization = patch.aiPersonalization;
  }
  if (patch.aiRecommendationStyle != null) {
    const allowed = ['balanced', 'adventure', 'relaxed', 'budget'];
    data.aiRecommendationStyle = allowed.includes(patch.aiRecommendationStyle)
      ? patch.aiRecommendationStyle
      : 'balanced';
  }
  if (patch.theme != null) {
    data.theme = ['system', 'light', 'dark'].includes(patch.theme) ? patch.theme : 'system';
  }

  const settings = await prisma.userSettings.update({
    where: { userId },
    data,
  });
  return serializeSettings(settings);
}

function serializeSettings(settings) {
  if (!settings) return { ...DEFAULT_SETTINGS };
  return {
    currency: settings.currency,
    distanceUnit: settings.distanceUnit,
    timeFormat: settings.timeFormat,
    preferredTransport: settings.preferredTransport,
    typicalTripLengthDays: settings.typicalTripLengthDays,
    preferredBudgetMin:
      settings.preferredBudgetMin != null ? Number(settings.preferredBudgetMin) : null,
    preferredBudgetMax:
      settings.preferredBudgetMax != null ? Number(settings.preferredBudgetMax) : null,
    travelInterests: Array.isArray(settings.travelInterests)
      ? settings.travelInterests
      : settings.travelInterests || [],
    notifyTripReminders: settings.notifyTripReminders,
    notifyBudgetAlerts: settings.notifyBudgetAlerts,
    notifyAiUpdates: settings.notifyAiUpdates,
    notifyTravelAlerts: settings.notifyTravelAlerts,
    aiPersonalization: settings.aiPersonalization,
    aiRecommendationStyle: settings.aiRecommendationStyle,
    theme: settings.theme,
  };
}
