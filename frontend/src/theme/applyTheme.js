import { normalizeTheme } from './constants.js';

/**
 * Apply theme class to document root (used on init and on change).
 * @param {'light' | 'dark' | string} theme
 */
export function applyTheme(theme) {
  const resolved = normalizeTheme(theme);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  requestAnimationFrame(() => {
    root.classList.add('theme-animate');
  });
  return resolved;
}

/**
 * Read persisted theme from localStorage.
 * @returns {'light' | 'dark'}
 */
export function readStoredTheme() {
  try {
    return normalizeTheme(localStorage.getItem('yolo-theme'));
  } catch {
    return 'light';
  }
}
