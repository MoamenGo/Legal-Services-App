import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import type { UserRole } from '@/server/db/schema';
import type { ApiEnv, AuthUser } from '../env';
import { apiError } from '../errors';

/** Requires a valid `Authorization: Bearer <access token>` and exposes `c.get('user')`. */
export const requireAuth = createMiddleware<ApiEnv>(async (c, next) => {
  const secret = c.env.JWT_ACCESS_SECRET;
  if (!secret) return apiError(c, 503, 'auth_not_configured', 'Authentication is not configured');
  const header = c.req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return apiError(c, 401, 'unauthorized', 'Sign in required');
  try {
    const payload = (await verify(token, secret, 'HS256')) as {
      sub: string;
      role: UserRole;
      name: string;
    };
    c.set('user', { id: payload.sub, role: payload.role, name: payload.name } satisfies AuthUser);
  } catch {
    return apiError(c, 401, 'unauthorized', 'Session expired');
  }
  await next();
});

export const requireRole = (...roles: UserRole[]) =>
  createMiddleware<ApiEnv>(async (c, next) => {
    if (!roles.includes(c.get('user').role)) {
      return apiError(c, 403, 'forbidden', 'Not allowed for your role');
    }
    await next();
  });
