import { Hono } from 'hono';
import { z } from 'zod';
import { leadStatuses } from '@/server/db/schema';
import { audit, diffOf } from '../../audit';
import type { ApiEnv } from '../../env';
import { apiError } from '../../errors';
import { requireAuth, requireRole } from '../../middleware/auth';
import { addNote, exportLeads, getLead, listLeads, toCsv, updateLead } from './service';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const filtersSchema = z.object({
  status: z.enum(leadStatuses).optional(),
  from: date.optional(),
  to: date.optional(),
  campaign: z.string().trim().max(200).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

const patchSchema = z
  .object({
    status: z.enum(leadStatuses).optional(),
    assignedTo: z.string().max(64).nullable().optional(),
    value: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
    note: z.string().trim().min(1).max(2000).optional(),
  })
  .strict();

export const adminLeadsRoutes = new Hono<ApiEnv>();

adminLeadsRoutes.use('/admin/leads', requireAuth);
adminLeadsRoutes.use('/admin/leads/*', requireAuth);

const parseFilters = (query: Record<string, string>) =>
  filtersSchema.safeParse(Object.fromEntries(Object.entries(query).filter(([, v]) => v !== '')));

adminLeadsRoutes.get('/admin/leads', async (c) => {
  const filters = parseFilters(c.req.query());
  if (!filters.success)
    return apiError(
      c,
      400,
      'validation_error',
      'Invalid filters',
      z.flattenError(filters.error).fieldErrors,
    );
  const result = await listLeads(c.env.DB, filters.data, c.get('user'));
  await audit(c, 'lead.list', 'lead', null);
  return c.json(result);
});

// Registered before `/:id` so "export.csv" is not read as an id.
adminLeadsRoutes.get('/admin/leads/export.csv', requireRole('admin', 'intake'), async (c) => {
  const filters = parseFilters(c.req.query());
  if (!filters.success) return apiError(c, 400, 'validation_error', 'Invalid filters');
  const rows = await exportLeads(c.env.DB, filters.data, c.get('user'));
  await audit(c, 'lead.export', 'lead', null, { count: [null, rows.length] });
  const csv = toCsv([
    [
      'id',
      'created_at',
      'name',
      'phone',
      'email',
      'case_type',
      'status',
      'value',
      'utm_source',
      'utm_campaign',
      'utm_term',
      'gclid',
      'assignee',
    ],
    ...rows.map((r) => {
      const source = (r.source ?? {}) as Record<string, string | undefined>;
      return [
        r.id,
        r.createdAt.toISOString(),
        r.name,
        r.phone,
        r.email,
        r.caseType,
        r.status,
        r.value,
        source.utm_source,
        source.utm_campaign,
        source.utm_term,
        source.gclid,
        r.assignee,
      ];
    }),
  ]);
  return c.body(csv, 200, {
    'content-type': 'text/csv; charset=utf-8',
    'content-disposition': `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    'cache-control': 'no-store',
  });
});

adminLeadsRoutes.get('/admin/leads/:id', async (c) => {
  const lead = await getLead(c.env.DB, c.req.param('id'), c.get('user'));
  if (!lead) return apiError(c, 404, 'not_found', 'Lead not found');
  await audit(c, 'lead.read', 'lead', lead.id);
  return c.json({ lead });
});

adminLeadsRoutes.patch('/admin/leads/:id', async (c) => {
  const user = c.get('user');
  const parsed = patchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success)
    return apiError(
      c,
      400,
      'validation_error',
      'Invalid update',
      z.flattenError(parsed.error).fieldErrors,
    );
  const { note, ...patch } = parsed.data;
  if (patch.assignedTo !== undefined && user.role === 'lawyer') {
    return apiError(c, 403, 'forbidden', 'Lawyers cannot reassign leads');
  }
  const before = await getLead(c.env.DB, c.req.param('id'), user);
  if (!before) return apiError(c, 404, 'not_found', 'Lead not found');

  const diff = diffOf(before, patch);
  if (Object.keys(diff).length > 0) {
    await updateLead(c.env.DB, before.id, patch);
    await audit(c, 'lead.update', 'lead', before.id, diff);
  }
  if (note) {
    await addNote(c.env.DB, before.id, user.id, note);
    await audit(c, 'lead.note', 'lead', before.id);
  }
  return c.json({ lead: await getLead(c.env.DB, before.id, user) });
});
