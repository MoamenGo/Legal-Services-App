import { Hono } from 'hono';
import { audit } from '../../audit';
import type { ApiEnv } from '../../env';
import { apiError } from '../../errors';
import { requireAuth, requireRole } from '../../middleware/auth';
import { dispatchDeploy, safeEqual, type PublishResult } from './service';

export const publishRoutes = new Hono<ApiEnv>();

const answer = (c: Parameters<typeof apiError>[0], result: PublishResult) =>
  result.ok
    ? c.json({ status: 'started' }, 202)
    : result.reason === 'not_configured'
      ? apiError(c, 503, 'publish_not_configured', 'Publishing is not configured')
      : apiError(c, 502, 'publish_failed', 'GitHub did not accept the deploy request', {
          status: [String(result.status ?? 'network')],
        });

publishRoutes.post('/admin/publish', requireAuth, requireRole('admin', 'intake'), async (c) => {
  const result = await dispatchDeploy(c.env);
  await audit(c, 'site.publish', 'site', null, { ok: [null, result.ok] });
  return answer(c, result);
});

/** For external tools (AGENTS.md section 5). Header `x-revalidate-secret` must match REVALIDATE_SECRET. */
publishRoutes.post('/webhooks/revalidate', async (c) => {
  const secret = c.env.REVALIDATE_SECRET;
  const given = c.req.header('x-revalidate-secret') ?? '';
  if (!secret || !safeEqual(given, secret))
    return apiError(c, 401, 'unauthorized', 'Invalid secret');
  return answer(c, await dispatchDeploy(c.env));
});
