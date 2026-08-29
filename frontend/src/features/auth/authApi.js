import { apiFetch } from '@/services/api.js';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function getMe() {
  return apiFetch('/api/auth/me');
}

export function logout() {
  return apiFetch('/api/auth/logout', { method: 'POST' });
}

export function login({ email, password, rememberMe }) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, rememberMe }),
  });
}

export function signup({ name, email, password, confirmPassword, rememberMe }) {
  return apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, confirmPassword, rememberMe }),
  });
}

export function forgotPassword(email) {
  return apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword({ token, password, confirmPassword }) {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password, confirmPassword }),
  });
}

export function getProfile() {
  return apiFetch('/api/auth/profile');
}

export function updateProfile(patch) {
  return apiFetch('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function getSettings() {
  return apiFetch('/api/auth/settings');
}

export function updateSettings(patch) {
  return apiFetch('/api/auth/settings', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function changePassword({ currentPassword, newPassword }) {
  return apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function listSessions() {
  return apiFetch('/api/auth/sessions');
}

export function revokeAllSessions() {
  return apiFetch('/api/auth/sessions/revoke-all', { method: 'POST' });
}

export function deleteAccount() {
  return apiFetch('/api/auth/account', { method: 'DELETE' });
}

/**
 * Start Google OAuth via backend origin so session cookies bind to the API host.
 * @param {string} [redirect]
 */
export function startGoogleLogin(redirect = '/dashboard') {
  const safe = redirect?.startsWith('/trips/new') ? '/dashboard' : redirect || '/dashboard';
  const url = `${BACKEND_URL}/api/auth/google?redirect=${encodeURIComponent(safe)}`;
  window.location.href = url;
}
