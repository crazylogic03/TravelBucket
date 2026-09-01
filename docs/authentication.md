# Authentication

Google OAuth 2.0 with server-side sessions and HTTP-only cookies.

## Flow

1. User opens `/login`
2. Clicks **Continue with Google**
3. Browser redirects to `GET /api/auth/google?redirect=...`
4. Backend stores OAuth state cookie and redirects to Google
5. Google returns to `GET /api/auth/google/callback`
6. Backend verifies state + code, upserts `User`, creates `Session` (token hashed)
7. Sets `yolo_session` HTTP-only cookie
8. Redirects to safe frontend path (default `/dashboard`)

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/auth/google` | No | Start OAuth |
| GET | `/api/auth/google/callback` | No | OAuth callback |
| GET | `/api/auth/me` | Session | Current user |
| POST | `/api/auth/logout` | Session | Invalidate session |

## Frontend guards

Protected routes use `ProtectedRoute`. Unauthenticated users are sent to:

`/login?redirect=<encoded-path>`

Authenticated users visiting `/login` are sent to the redirect target or `/dashboard`.
