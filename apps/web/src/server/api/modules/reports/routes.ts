import { Hono } from 'hono';
import { z } from 'zod';
import type { ApiEnv } from '../../env';
import { apiError } from '../../errors';
import { requireAuth, requireRole } from '../../middleware/auth';
import { funnel, funnelGroups } from './service';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const querySchema = z.object({
  from: date.optional(),
  to: date.optional(),
  groupBy: z.enum(funnelGroups).default('campaign'),
});

export const reportsRoutes = new Hono<ApiEnv>();

reportsRoutes.use('/admin/reports/*', requireAuth, requireRole('admin', 'intake'));

reportsRoutes.get('/admin/reports/funnel', async (c) => {
  const query = Object.fromEntries(Object.entries(c.req.query()).filter(([, v]) => v !== ''));
  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return apiError(
      c,
      400,
      'validation_error',
      'Invalid report filters',
      z.flattenError(parsed.error).fieldErrors,
    );
  }
  return c.json({
    groupBy: parsed.data.groupBy,
    rows: await funnel(c.env.DB, parsed.data, c.get('user')),
  });
});
