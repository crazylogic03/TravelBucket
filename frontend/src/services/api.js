/** Backend origin in production; empty in dev so Vite proxy handles /api fetch calls. */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/** Backend origin for full-page redirects (OAuth) — always targets the API host. */
export function getApiOrigin() {
  return API_BASE || import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://yolo-backend-t28z.onrender.com';
}

/**
 * Fetch helper with credentials for session cookies.
 * @param {string} path
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const error = new Error(data?.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
