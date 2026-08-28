import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/features/auth/authStore.js';
import { getSettings, updateSettings } from '@/features/auth/authApi.js';
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  normalizeTheme,
} from '@/theme/constants.js';
import { applyTheme, readStoredTheme } from '@/theme/applyTheme.js';

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  resolved: DEFAULT_THEME,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const { status } = useAuthStore();
  const [theme, setThemeState] = useState(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    getSettings()
      .then((data) => {
        const server = normalizeTheme(data.settings?.theme);
        setThemeState(server);
      })
      .catch(() => {});
  }, [status]);

  const setTheme = useCallback(async (next) => {
    const normalized = normalizeTheme(next);
    setThemeState(normalized);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch {
      /* ignore */
    }
    if (status === 'authenticated') {
      try {
        await updateSettings({ theme: normalized });
      } catch {
        /* local theme still applies */
      }
    }
  }, [status]);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const normalized = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, normalized);
      } catch {
        /* ignore */
      }
      if (status === 'authenticated') {
        updateSettings({ theme: normalized }).catch(() => {});
      }
      return normalized;
    });
  }, [status]);

  const value = useMemo(
    () => ({
      theme,
      resolved: theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
