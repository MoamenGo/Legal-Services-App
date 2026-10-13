import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer } from '@/server/test/auth';
import { createTestDb, insertLead, insertUser, testEnv } from '@/server/test/d1';
import { api } from '../../app';

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let admin: string;
let lawyer: string;

beforeAll(async () => {
  ctx = await createTestDb();
  admin = await insertUser(ctx.db, { role: 'admin', email: 'admin@example.test' });
  lawyer = await insertUser(ctx.db, { role: 'lawyer', email: 'lawyer@example.test' });
  for (const status of ['new', 'contacted', 'qualified', 'retained', 'spam']) {
    await insertLead(ctx.db, { campaign: 'labor', status });
  }
  await insertLead(ctx.db, { campaign: 'commercial', status: 'consultation_booked' });
  await insertLead(ctx.db, { status: 'new' });
  await ctx.db.prepare("update leads set value = 20000 where status = 'retained'").run();
  await insertLead(ctx.db, { campaign: 'labor', createdAt: new Date('2025-01-01T12:00:00Z') });
});
afterAll(() => ctx.dispose());

const get = async (query: string, as: 'admin' | 'lawyer' = 'admin') =>
  api.request(
    `/api/admin/reports/funnel${query}`,
    { headers: await bearer(as === 'admin' ? admin : lawyer, as) },
    testEnv(ctx.db),
  );

type Row = {
  key: string | null;
  leads: number;
  contacted: number;
  qualified: number;
  booked: number;
  retained: number;
  spam: number;
  value: number;
};

describe('GET /api/admin/reports/funnel', () => {
  it('counts each stage cumulatively per campaign within the dates', async () => {
    const res = await get('?from=2026-01-01');
    expect(res.status).toBe(200);
    const { rows } = (await res.json()) as { rows: Row[] };
    expect(rows.find((r) => r.key === 'labor')).toEqual({
      key: 'labor',
      leads: 5,
      contacted: 3,
      qualified: 2,
      booked: 1,
      retained: 1,
      lost: 0,
      spam: 1,
      value: 20000,
    });
    expect(rows.find((r) => r.key === 'commercial')).toMatchObject({
      leads: 1,
      qualified: 1,
      booked: 1,
    });
    expect(rows.find((r) => r.key === null)).toMatchObject({ leads: 1 });
  });

  it('groups by landing page', async () => {
    const { rows } = (await (await get('?groupBy=landingPage')).json()) as { rows: Row[] };
    expect(rows.length).toBeGreaterThan(0);
  });

  it('is denied to lawyers and rejects bad input', async () => {
    expect((await get('', 'lawyer')).status).toBe(403);
    expect((await get('?groupBy=device')).status).toBe(400);
  });
});
