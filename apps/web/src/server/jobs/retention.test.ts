import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, insertLead, insertUser } from '@/server/test/d1';
import { enqueue } from './outbox';
import { anonymizedSource, anonymizeOldLeads, retentionMonths } from './retention';
import { DAILY_CRON, runScheduled } from './scheduled';

let ctx: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  ctx = await createTestDb();
});
afterAll(() => ctx.dispose());

const lead = (id: string) =>
  ctx.db
    .prepare(
      'select name, phone, email, message, source, status, anonymized_at from leads where id = ?',
    )
    .bind(id)
    .first<{
      name: string;
      phone: string;
      email: string | null;
      message: string | null;
      source: string;
      status: string;
      anonymized_at: number | null;
    }>();

const monthsAgo = (n: number) => {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() - n);
  return date;
};

describe('anonymizedSource', () => {
  it('keeps campaign fields and landing paths, and drops click ids, referrers and query strings', () => {
    expect(
      anonymizedSource({
        utm_campaign: 'labor-riyadh',
        utm_term: 'محامي عمالي',
        gclid: 'TEST-gclid',
        referrer: 'https://www.google.com/search?q=name',
        landingPage: '/ar/lp/labor?gclid=TEST-gclid',
        device: 'mobile',
      }),
    ).toEqual({
      utm_campaign: 'labor-riyadh',
      utm_term: 'محامي عمالي',
      landingPage: '/ar/lp/labor',
      device: 'mobile',
    });
    expect(anonymizedSource(null)).toEqual({});
  });
});

describe('retentionMonths', () => {
  it('falls back to 24 for missing or invalid values', () => {
    expect(retentionMonths('12')).toBe(12);
    expect(retentionMonths(undefined)).toBe(24);
    expect(retentionMonths('0')).toBe(24);
    expect(retentionMonths('abc')).toBe(24);
  });
});

describe('anonymizeOldLeads', () => {
  it('strips PII, notes and job payloads from old leads and leaves recent ones alone', async () => {
    const userId = await insertUser(ctx.db, { role: 'intake', email: 'retention@example.test' });
    const old = await insertLead(ctx.db, {
      name: 'عميل قديم',
      status: 'retained',
      campaign: 'labor-riyadh',
      gclid: 'TEST-gclid-old',
      createdAt: monthsAgo(25),
    });
    const recent = await insertLead(ctx.db, { name: 'عميل حديث', createdAt: monthsAgo(23) });
    await ctx.db
      .prepare('insert into lead_notes (id, lead_id, user_id, text) values (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), old, userId, 'اتصل العميل من رقم آخر')
      .run();
    await enqueue(ctx.db, [
      { type: 'client_email', leadId: old, payload: { to: 'old@example.test' } },
    ]);

    expect(await anonymizeOldLeads(ctx.db, 24)).toBe(1);

    const anonymized = await lead(old);
    expect(anonymized).toMatchObject({
      name: '',
      phone: '',
      email: null,
      message: null,
      status: 'retained',
    });
    expect(anonymized?.anonymized_at).not.toBeNull();
    expect(JSON.parse(anonymized!.source)).toEqual({ utm_campaign: 'labor-riyadh' });
    const notes = await ctx.db
      .prepare('select count(*) as n from lead_notes where lead_id = ?')
      .bind(old)
      .first<{ n: number }>();
    expect(notes?.n).toBe(0);
    const payloads = await ctx.db
      .prepare('select payload from jobs where lead_id = ?')
      .bind(old)
      .all<{ payload: string }>();
    expect(payloads.results.map((row) => row.payload)).toEqual(['{}']);

    expect(await lead(recent)).toMatchObject({ name: 'عميل حديث', anonymized_at: null });
    // Already anonymized rows are not touched again.
    expect(await anonymizeOldLeads(ctx.db, 24)).toBe(0);
  });

  it('runs from the daily cron with the configured period', async () => {
    const id = await insertLead(ctx.db, { name: 'عميل ستة أشهر', createdAt: monthsAgo(7) });
    const env = { DB: ctx.db, LEAD_RETENTION_MONTHS: '6' } as unknown as CloudflareEnv;
    await runScheduled('*/10 * * * *', env);
    expect(await lead(id)).toMatchObject({ name: 'عميل ستة أشهر' });
    await runScheduled(DAILY_CRON, env);
    expect(await lead(id)).toMatchObject({ name: '' });
  });
});
