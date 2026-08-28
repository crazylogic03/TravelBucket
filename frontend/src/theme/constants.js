/** @typedef {'light' | 'dark'} ThemeMode */

export const THEME_STORAGE_KEY = 'yolo-theme';

/** @type {ThemeMode} */
export const DEFAULT_THEME = 'light';

/** @type {ThemeMode[]} */
export const THEME_MODES = ['light', 'dark'];

/**
 * Normalize stored/API theme values to light | dark.
 * @param {string | null | undefined} value
 * @returns {ThemeMode}
 */
export function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light';
}
