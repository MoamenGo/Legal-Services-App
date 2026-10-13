import { leadInputSchema } from '@app/schemas';
import { Hono } from 'hono';
import { z } from 'zod';
import { site } from '@/content/site';
import { turnstileSecret, verifyTurnstile } from '@/server/lib/turnstile';
import { uuidv7 } from '@/server/lib/uuid';
import type { ApiEnv } from '../../env';
import { apiError } from '../../errors';
import { createLead } from './service';

export const leadsRoutes = new Hono<ApiEnv>();

leadsRoutes.post('/leads', async (c) => {
  const ip = c.req.header('cf-connecting-ip');
  const { success } = await c.env.LEAD_RATE_LIMITER.limit({ key: ip ?? 'unknown' });
  if (!success) return apiError(c, 429, 'rate_limited', 'Too many requests');

  const body: unknown = await c.req.json().catch(() => null);

  // Honeypot filled: answer like a success so bots learn nothing, and store nothing.
  if (body && typeof body === 'object' && 'website' in body && body.website) {
    return c.json({ id: uuidv7() }, 201);
  }

  const parsed = leadInputSchema.safeParse(body);
  if (!parsed.success) {
    // Field names and messages only; never echo the submitted values.
    return apiError(
      c,
      400,
      'validation_error',
      'Invalid lead',
      z.flattenError(parsed.error).fieldErrors,
    );
  }

  const secret = turnstileSecret(c.env, site.turnstileSiteKey);
  if (!secret) return apiError(c, 503, 'captcha_not_configured', 'Captcha is not configured');
  if (!(await verifyTurnstile(parsed.data.turnstileToken, secret, ip))) {
    return apiError(c, 400, 'captcha_failed', 'Captcha verification failed');
  }

  const id = await createLead(c.env.DB, parsed.data);
  // Phase 3 enqueues the intake notification, auto-reply and GA4 event here (LEAD_JOBS queue).
  return c.json({ id }, 201);
});
