import { Hono } from 'hono';
import { apiError } from './errors';
import { leadsRoutes } from './modules/leads/routes';

export type ApiEnv = {
  Bindings: Pick<CloudflareEnv, 'DB' | 'LEAD_RATE_LIMITER'> & {
    /** Secret set with `wrangler secret put`; absent while the template uses Turnstile test keys. */
    TURNSTILE_SECRET_KEY?: string;
  };
};

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

api.notFound((c) => apiError(c, 404, 'not_found', 'Route not found'));

api.onError((err, c) => {
  // Never echo internal errors (or any lead PII) back to the client.
  console.error('api_error', err instanceof Error ? err.message : 'unknown');
  return apiError(c, 500, 'internal_error', 'Something went wrong');
});
