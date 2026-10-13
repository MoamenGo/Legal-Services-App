import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import { audit } from '../../audit';
import type { ApiEnv } from '../../env';
import { apiError } from '../../errors';
import { requireAuth } from '../../middleware/auth';
import { login, logout, refresh, REFRESH_TOKEN_SECONDS, signAccessToken } from './service';

const REFRESH_COOKIE = 'refresh_token';

const loginSchema = z.object({ email: z.email().max(200), password: z.string().min(1).max(200) });

// Strict SameSite and a path limited to /api/auth keep the cookie out of every other request.
const setRefreshCookie = (c: Context<ApiEnv>, token: string) =>
  setCookie(c, REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Strict',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_SECONDS,
  });

export const authRoutes = new Hono<ApiEnv>();

authRoutes.use('/auth/*', async (c, next) => {
  if (!c.env.JWT_ACCESS_SECRET)
    return apiError(c, 503, 'auth_not_configured', 'Authentication is not configured');
  await next();
});

// Only password guessing needs the strict per-IP limit. Refresh tokens are 256-bit random values,
// and limiting them would let staff sharing one office IP lock each other out by opening pages.
authRoutes.use('/auth/login', async (c, next) => {
  const { success } = await c.env.AUTH_RATE_LIMITER.limit({
    key: c.req.header('cf-connecting-ip') ?? 'unknown',
  });
  if (!success) return apiError(c, 429, 'rate_limited', 'Too many requests');
  await next();
});

authRoutes.post('/auth/login', async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return apiError(c, 400, 'validation_error', 'Email and password are required');
  const result = await login(c.env.DB, parsed.data.email, parsed.data.password);
  if (!result.ok) {
    return result.reason === 'locked'
      ? apiError(c, 423, 'account_locked', 'Too many failed attempts, try again in 15 minutes')
      : apiError(c, 401, 'invalid_credentials', 'Wrong email or password');
  }
  setRefreshCookie(c, result.refreshToken);
  c.set('user', result.user);
  await audit(c, 'auth.login', 'user', result.user.id);
  return c.json({
    accessToken: await signAccessToken(result.user, c.env.JWT_ACCESS_SECRET!),
    user: result.user,
  });
});

authRoutes.post('/auth/refresh', async (c) => {
  const token = getCookie(c, REFRESH_COOKIE);
  const result = token ? await refresh(c.env.DB, token) : null;
  if (!result) {
    deleteCookie(c, REFRESH_COOKIE, { path: '/api/auth' });
    return apiError(c, 401, 'unauthorized', 'Sign in required');
  }
  setRefreshCookie(c, result.refreshToken);
  return c.json({
    accessToken: await signAccessToken(result.user, c.env.JWT_ACCESS_SECRET!),
    user: result.user,
  });
});

authRoutes.post('/auth/logout', async (c) => {
  const token = getCookie(c, REFRESH_COOKIE);
  if (token) await logout(c.env.DB, token);
  deleteCookie(c, REFRESH_COOKIE, { path: '/api/auth' });
  return c.body(null, 204);
});

authRoutes.get('/admin/me', requireAuth, (c) => c.json({ user: c.get('user') }));
