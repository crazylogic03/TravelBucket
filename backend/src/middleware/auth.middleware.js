import {
  SESSION_COOKIE,
  validateSession,
} from '../services/auth/session.service.js';

/**
 * Auth middleware — attaches request.user when session is valid.
 */
export async function optionalAuth(request, _reply) {
  const token = request.cookies?.[SESSION_COOKIE];
  const result = await validateSession(token);
  if (result) {
    request.user = result.user;
    request.session = result.session;
  } else {
    request.user = null;
    request.session = null;
  }
}

/**
 * Require authenticated user.
 */
export async function requireAuth(request, reply) {
  await optionalAuth(request, reply);
  if (!request.user) {
    return reply.status(401).send({ error: 'Authentication required' });
  }
}
