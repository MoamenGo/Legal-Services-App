import { Hono } from 'hono';
import { apiError } from './errors';
import type { ApiEnv } from './env';
import { adminLeadsRoutes } from './modules/admin-leads/routes';
import { articlesRoutes } from './modules/articles/routes';
import { authRoutes } from './modules/auth/routes';
import { leadsRoutes } from './modules/leads/routes';
import { publishRoutes } from './modules/publish/routes';
import { reportsRoutes } from './modules/reports/routes';
import { settingsRoutes } from './modules/settings/routes';
import { usersRoutes } from './modules/users/routes';

export type { ApiEnv } from './env';

export const api = new Hono<ApiEnv>().basePath('/api');

api.get('/health', async (c) => {
  let db: 'ok' | 'unavailable' = 'ok';
  try {
    await c.env.DB.prepare('select 1').first();
  } catch {
    db = 'unavailable';
  }
  return c.json({ status: db === 'ok' ? 'ok' : 'degraded', db }, db === 'ok' ? 200 : 503);
});

api.route('/', leadsRoutes);
api.route('/', authRoutes);
api.route('/', adminLeadsRoutes);
api.route('/', usersRoutes);
api.route('/', reportsRoutes);
api.route('/', articlesRoutes);
api.route('/', settingsRoutes);
api.route('/', publishRoutes);

api.notFound((c) => apiError(c, 404, 'not_found', 'Route not found'));

api.onError((err, c) => {
  // Never echo internal errors (or any lead PII) back to the client.
  console.error('api_error', err instanceof Error ? err.message : 'unknown');
  return apiError(c, 500, 'internal_error', 'Something went wrong');
});
