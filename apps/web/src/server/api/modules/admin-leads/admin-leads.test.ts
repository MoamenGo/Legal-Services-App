import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer } from '@/server/test/auth';
import { createTestDb, insertLead, insertUser, testEnv } from '@/server/test/d1';
import { api } from '../../app';
import { toCsv } from './service';

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let ids: { admin: string; intake: string; lawyer: string; otherLawyer: string };
let leadIds: { mine: string; other: string; campaign: string; old: string };

beforeAll(async () => {
  ctx = await createTestDb();
  ids = {
    admin: await insertUser(ctx.db, { role: 'admin', email: 'admin@example.test' }),
    intake: await insertUser(ctx.db, { role: 'intake', email: 'intake@example.test' }),
    lawyer: await insertUser(ctx.db, { role: 'lawyer', email: 'lawyer@example.test' }),
    otherLawyer: await insertUser(ctx.db, { role: 'lawyer', email: 'lawyer2@example.test' }),
  };
  leadIds = {
    mine: await insertLead(ctx.db, { name: 'محمد العتيبي', assignedTo: ids.lawyer, gclid: 'g-1' }),
    other: await insertLead(ctx.db, {
      name: 'Sara Test',
      phone: '+966551112222',
      assignedTo: ids.otherLawyer,
    }),
    campaign: await insertLead(ctx.db, {
      name: '=HYPERLINK("http://evil")',
      campaign: 'labor-riyadh',
      status: 'qualified',
    }),
    // 2026-01-31 23:30 Riyadh time is still January 31 there, though it is 20:30 UTC.
    old: await insertLead(ctx.db, { name: 'قديم', createdAt: new Date('2026-01-31T20:30:00Z') }),
  };
});
afterAll(() => ctx.dispose());

type List = { items: { id: string }[]; total: number };
const get = async (path: string, role: keyof typeof ids) =>
  api.request(
    path,
    { headers: await bearer(ids[role], role === 'otherLawyer' ? 'lawyer' : role) },
    testEnv(ctx.db),
  );
const patch = async (id: string, body: unknown, role: keyof typeof ids) =>
  api.request(
    `/api/admin/leads/${id}`,
    {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        ...(await bearer(ids[role], role === 'otherLawyer' ? 'lawyer' : role)),
      },
      body: JSON.stringify(body),
    },
    testEnv(ctx.db),
  );

describe('GET /api/admin/leads', () => {
  it('requires a token', async () => {
    expect((await api.request('/api/admin/leads', {}, testEnv(ctx.db))).status).toBe(401);
  });

  it('shows intake every lead and logs the read', async () => {
    const res = await get('/api/admin/leads', 'intake');
    expect(res.status).toBe(200);
    expect(((await res.json()) as List).total).toBe(4);
    const row = await ctx.db
      .prepare("select user_id from audit_log where action = 'lead.list'")
      .first<{ user_id: string }>();
    expect(row?.user_id).toBe(ids.intake);
  });

  it('shows a lawyer only the leads assigned to them', async () => {
    const body = (await (await get('/api/admin/leads', 'lawyer')).json()) as List;
    expect(body.items.map((l) => l.id)).toEqual([leadIds.mine]);
    expect((await get(`/api/admin/leads/${leadIds.other}`, 'lawyer')).status).toBe(404);
  });

  it('filters by status, campaign, search and Riyadh-time dates', async () => {
    const ids_ = async (q: string) =>
      ((await (await get(`/api/admin/leads?${q}`, 'admin')).json()) as List).items.map((l) => l.id);
    expect(await ids_('status=qualified')).toEqual([leadIds.campaign]);
    expect(await ids_('campaign=labor-riyadh')).toEqual([leadIds.campaign]);
    expect(await ids_('q=551112222')).toEqual([leadIds.other]);
    expect(await ids_('q=العتيبي')).toEqual([leadIds.mine]);
    expect(await ids_('from=2026-01-31&to=2026-01-31')).toEqual([leadIds.old]);
    expect(await ids_('from=2026-02-01&to=2026-02-01')).toEqual([]);
  });

  it('rejects bad filters', async () => {
    expect((await get('/api/admin/leads?status=won', 'admin')).status).toBe(400);
    expect((await get('/api/admin/leads?from=yesterday', 'admin')).status).toBe(400);
  });
});

describe('PATCH /api/admin/leads/:id', () => {
  it('updates status, value and a note, and audits the change without PII', async () => {
    const res = await patch(
      leadIds.mine,
      { status: 'qualified', value: 15000, note: 'اتصلنا بالعميل' },
      'intake',
    );
    expect(res.status).toBe(200);
    const { lead } = (await res.json()) as {
      lead: { status: string; value: number; notes: { text: string; by: string }[] };
    };
    expect(lead.status).toBe('qualified');
    expect(lead.value).toBe(15000);
    expect(lead.notes[0]).toMatchObject({ text: 'اتصلنا بالعميل', by: 'Test intake' });

    const row = await ctx.db
      .prepare("select diff from audit_log where action = 'lead.update' and entity_id = ?")
      .bind(leadIds.mine)
      .first<{ diff: string }>();
    expect(JSON.parse(row!.diff)).toEqual({ status: ['new', 'qualified'], value: [null, 15000] });

    // The lead came from an ad (gclid), so qualifying it queues one offline conversion upload.
    const jobs = await ctx.db
      .prepare("select payload from jobs where type = 'ads_conversion' and lead_id = ?")
      .bind(leadIds.mine)
      .all<{ payload: string }>();
    expect(jobs.results).toHaveLength(1);
    expect(JSON.parse(jobs.results[0]!.payload)).toMatchObject({ action: 'qualified' });
  });

  it('does not queue a conversion for a lead without a click id', async () => {
    expect((await patch(leadIds.other, { status: 'qualified' }, 'admin')).status).toBe(200);
    const row = await ctx.db
      .prepare('select count(*) as n from jobs where lead_id = ?')
      .bind(leadIds.other)
      .first<{ n: number }>();
    expect(row?.n).toBe(0);
  });

  it('lets a lawyer update their own lead but not reassign it or touch others', async () => {
    expect((await patch(leadIds.mine, { status: 'contacted' }, 'lawyer')).status).toBe(200);
    expect((await patch(leadIds.mine, { assignedTo: ids.otherLawyer }, 'lawyer')).status).toBe(403);
    expect((await patch(leadIds.other, { status: 'lost' }, 'lawyer')).status).toBe(404);
  });

  it('rejects unknown fields and bad values', async () => {
    expect((await patch(leadIds.mine, { name: 'changed' }, 'admin')).status).toBe(400);
    expect((await patch(leadIds.mine, { status: 'won' }, 'admin')).status).toBe(400);
  });
});

describe('GET /api/admin/leads/export.csv', () => {
  it('is denied to lawyers', async () => {
    expect((await get('/api/admin/leads/export.csv', 'lawyer')).status).toBe(403);
  });

  it('exports CSV with formula cells neutralized', async () => {
    const res = await get('/api/admin/leads/export.csv?campaign=labor-riyadh', 'admin');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const text = await res.text();
    expect(text.split('\r\n')).toHaveLength(2);
    expect(text).toContain(`"'=HYPERLINK(""http://evil"")"`);
  });
});

describe('toCsv', () => {
  it('quotes, escapes and starts with a BOM', () => {
    expect(toCsv([['a,b', 'say "hi"', null, '-1', 7]])).toBe('﻿"a,b","say ""hi""","","\'-1","7"');
  });
});

describe('POST /api/admin/leads/:id/anonymize', () => {
  const anonymize = async (id: string, role: keyof typeof ids) =>
    api.request(
      `/api/admin/leads/${id}/anonymize`,
      {
        method: 'POST',
        headers: await bearer(ids[role], role === 'otherLawyer' ? 'lawyer' : role),
      },
      testEnv(ctx.db),
    );

  it('is admin only', async () => {
    expect((await anonymize(leadIds.mine, 'intake')).status).toBe(403);
    expect((await anonymize(leadIds.mine, 'lawyer')).status).toBe(403);
  });

  it('clears the PII of one lead and logs it', async () => {
    const id = await insertLead(ctx.db, { name: 'طلب حذف', gclid: 'TEST-gclid-del' });
    const res = await anonymize(id, 'admin');
    expect(res.status).toBe(200);
    const { lead } = (await res.json()) as {
      lead: { name: string; phone: string; source: Record<string, string>; anonymizedAt: string };
    };
    expect(lead).toMatchObject({ name: '', phone: '' });
    expect(lead.source.gclid).toBeUndefined();
    expect(lead.anonymizedAt).toBeTruthy();
    const row = await ctx.db
      .prepare("select user_id from audit_log where action = 'lead.anonymize' and entity_id = ?")
      .bind(id)
      .first<{ user_id: string }>();
    expect(row?.user_id).toBe(ids.admin);
    expect((await anonymize('missing', 'admin')).status).toBe(404);
  });
});
