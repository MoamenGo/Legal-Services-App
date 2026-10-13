import { settingsSchema } from '@app/schemas';
import { Hono } from 'hono';
import { z } from 'zod';
import { audit, diffOf } from '../../audit';
import type { ApiEnv } from '../../env';
import { apiError } from '../../errors';
import { requireAuth, requireRole } from '../../middleware/auth';
import { readSettings, writeSettings } from './service';

export const settingsRoutes = new Hono<ApiEnv>();

// Everything stored here is meant for the public site (phone, address...).
settingsRoutes.get('/settings/public', async (c) =>
  c.json({ settings: await readSettings(c.env.DB) }),
);

settingsRoutes.use('/admin/settings', requireAuth, requireRole('admin'));

settingsRoutes.get('/admin/settings', async (c) =>
  c.json({ settings: await readSettings(c.env.DB) }),
);

settingsRoutes.put('/admin/settings', async (c) => {
  const parsed = settingsSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return apiError(
      c,
      400,
      'validation_error',
      'Invalid settings',
      z.flattenError(parsed.error).fieldErrors,
    );
  }
  const before = await readSettings(c.env.DB);
  await writeSettings(c.env.DB, parsed.data);
  await audit(c, 'settings.update', 'settings', null, diffOf(before, parsed.data));
  return c.json({ settings: parsed.data });
});
