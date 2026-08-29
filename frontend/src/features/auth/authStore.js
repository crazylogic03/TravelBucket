import { create } from 'zustand';
import { getMe, logout as logoutApi } from './authApi.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  status: 'idle', // idle | loading | authenticated | unauthenticated
  error: null,

  async bootstrap() {
    if (get().status === 'loading') return;
    set({ status: 'loading', error: null });
    try {
      const data = await Promise.race([
        getMe(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth check timed out')), 8000);
        }),
      ]);
      set({ user: data.user, status: 'authenticated', error: null });
    } catch {
      set({ user: null, status: 'unauthenticated', error: null });
    }
  },

  async logout() {
    try {
      await logoutApi();
    } finally {
      set({ user: null, status: 'unauthenticated' });
    }
  },

  setUser(user) {
    set({ user, status: user ? 'authenticated' : 'unauthenticated' });
  },
}));
