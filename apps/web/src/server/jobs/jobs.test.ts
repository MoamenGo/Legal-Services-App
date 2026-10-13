import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestDb, insertLead } from '@/server/test/d1';
import type { JobsEnv } from './env';
import { adsDateTime } from './handlers';
import { enqueue, MAX_ATTEMPTS, runJobs } from './outbox';

let ctx: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  ctx = await createTestDb();
});
afterAll(() => ctx.dispose());
afterEach(() => vi.unstubAllGlobals());

const mailEnv = (): JobsEnv => ({
  DB: ctx.db,
  NEXT_PUBLIC_SITE_URL: 'https://example.test',
  RESEND_API_KEY: 're_test',
  MAIL_FROM: 'Firm <noreply@example.test>',
  INTAKE_NOTIFY_EMAILS: 'intake@example.test, partner@example.test',
});

const job = (id: string) =>
  ctx.db
    .prepare('select status, attempts, run_after, last_error from jobs where id = ?')
    .bind(id)
    .first<{
      status: string;
      attempts: number;
      run_after: number;
      last_error: string | null;
    }>();

const ok = () => vi.fn(async () => new Response('{}', { status: 200 }));

describe('enqueue', () => {
  it('ignores a job whose dedupe key already exists', async () => {
    const leadId = await insertLead(ctx.db);
    const first = await enqueue(ctx.db, [{ type: 'ga4_lead', leadId, dedupeKey: `${leadId}:ga4` }]);
    const again = await enqueue(ctx.db, [{ type: 'ga4_lead', leadId, dedupeKey: `${leadId}:ga4` }]);
    expect(first).toHaveLength(1);
    expect(again).toHaveLength(0);
  });
});

describe('runJobs', () => {
  it('skips jobs whose integration is not configured, without calling out', async () => {
    const fetchMock = ok();
    vi.stubGlobal('fetch', fetchMock);
    const leadId = await insertLead(ctx.db);
    const [id] = await enqueue(ctx.db, [{ type: 'intake_email', leadId }]);
    await runJobs({ DB: ctx.db }, { ids: [id!] });
    expect(await job(id!)).toMatchObject({ status: 'skipped', last_error: 'email not configured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('emails the intake team a summary with the admin link and an idempotency key', async () => {
    const fetchMock = ok();
    vi.stubGlobal('fetch', fetchMock);
    const leadId = await insertLead(ctx.db, { name: 'عميل البريد', campaign: 'labor-riyadh' });
    const [id] = await enqueue(ctx.db, [{ type: 'intake_email', leadId }]);
    await runJobs(mailEnv(), { ids: [id!] });

    expect(await job(id!)).toMatchObject({ status: 'done', attempts: 1 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>)['idempotency-key']).toBe(id);
    const body = JSON.parse(init.body as string) as { to: string[]; subject: string; text: string };
    expect(body.to).toEqual(['intake@example.test', 'partner@example.test']);
    expect(body.subject).toContain('عمالية');
    expect(body.text).toContain('labor-riyadh');
    expect(body.text).toContain(`https://example.test/admin/lead?id=${leadId}`);
  });

  it('retries with backoff, then marks the job failed after the last attempt', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('down', { status: 503 })),
    );
    const leadId = await insertLead(ctx.db);
    const [id] = await enqueue(ctx.db, [{ type: 'intake_email', leadId }]);

    await runJobs(mailEnv(), { ids: [id!] });
    const afterFirst = await job(id!);
    expect(afterFirst).toMatchObject({
      status: 'pending',
      attempts: 1,
      last_error: 'resend answered 503',
    });
    expect(afterFirst!.run_after).toBeGreaterThan(Date.now() / 1000 + 30);

    // A cron run before the backoff ends leaves it alone.
    await runJobs(mailEnv());
    expect((await job(id!))!.attempts).toBe(1);

    for (let i = 1; i < MAX_ATTEMPTS; i++) await runJobs(mailEnv(), { ids: [id!] });
    expect(await job(id!)).toMatchObject({ status: 'failed', attempts: MAX_ATTEMPTS });
  });

  it('never runs the same job twice when two runs overlap', async () => {
    const fetchMock = ok();
    vi.stubGlobal('fetch', fetchMock);
    const leadId = await insertLead(ctx.db);
    const [id] = await enqueue(ctx.db, [{ type: 'intake_email', leadId }]);
    await Promise.all([runJobs(mailEnv(), { ids: [id!] }), runJobs(mailEnv(), { ids: [id!] })]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('sends the client auto-reply in their language, and skips leads without email', async () => {
    const fetchMock = ok();
    vi.stubGlobal('fetch', fetchMock);
    const withEmail = await insertLead(ctx.db);
    await ctx.db
      .prepare("update leads set email = 'c@example.test', language = 'en' where id = ?")
      .bind(withEmail)
      .run();
    const without = await insertLead(ctx.db);
    const ids = await enqueue(ctx.db, [
      { type: 'client_email', leadId: withEmail },
      { type: 'client_email', leadId: without },
    ]);
    await runJobs(mailEnv(), { ids });
    expect(await job(ids[0]!)).toMatchObject({ status: 'done' });
    expect(await job(ids[1]!)).toMatchObject({
      status: 'skipped',
      last_error: 'lead has no email',
    });
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    ) as {
      subject: string;
      text: string;
    };
    expect(body.subject).toBe('We received your consultation request');
    expect(body.text).toContain('not legal advice');
  });

  it('sends the GA4 server event without PII', async () => {
    const fetchMock = ok();
    vi.stubGlobal('fetch', fetchMock);
    const leadId = await insertLead(ctx.db, { name: 'سري جدا', phone: '+966559998877' });
    const [id] = await enqueue(ctx.db, [{ type: 'ga4_lead', leadId }]);
    await runJobs(
      { DB: ctx.db, GA4_MEASUREMENT_ID: 'G-TEST', GA4_API_SECRET: 's' },
      { ids: [id!] },
    );
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('measurement_id=G-TEST');
    expect(init.body).toContain('generate_lead');
    expect(init.body).not.toContain('سري');
    expect(init.body).not.toContain('559998877');
  });
});

describe('ads_conversion', () => {
  const adsEnv = (): JobsEnv => ({
    DB: ctx.db,
    GOOGLE_ADS_DEVELOPER_TOKEN: 'dev',
    GOOGLE_ADS_CLIENT_ID: 'cid',
    GOOGLE_ADS_CLIENT_SECRET: 'secret',
    GOOGLE_ADS_REFRESH_TOKEN: 'refresh',
    GOOGLE_ADS_CUSTOMER_ID: '123-456-7890',
    GOOGLE_ADS_CONVERSION_ACTION_QUALIFIED: '111',
  });
  const google = (adsBody: unknown) =>
    vi.fn(async (url: string) =>
      url.includes('oauth2')
        ? new Response(JSON.stringify({ access_token: 'at' }))
        : new Response(JSON.stringify(adsBody)),
    );

  it('uploads the click id and records the result on the lead', async () => {
    const fetchMock = google({ results: [{}] });
    vi.stubGlobal('fetch', fetchMock);
    const leadId = await insertLead(ctx.db, { gclid: 'TEST-GCLID' });
    const [id] = await enqueue(ctx.db, [
      {
        type: 'ads_conversion',
        leadId,
        payload: { action: 'qualified', at: '2026-10-13T10:00:00Z' },
      },
    ]);
    await runJobs(adsEnv(), { ids: [id!] });

    expect(await job(id!)).toMatchObject({ status: 'done' });
    const [url, init] = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(url).toContain('/customers/1234567890:uploadClickConversions');
    const sent = JSON.parse(init.body as string) as { conversions: Record<string, unknown>[] };
    expect(sent.conversions[0]).toMatchObject({
      gclid: 'TEST-GCLID',
      conversionAction: 'customers/1234567890/conversionActions/111',
      conversionDateTime: '2026-10-13 13:00:00+03:00',
    });
    const row = await ctx.db
      .prepare('select conversions_uploaded as c from leads where id = ?')
      .bind(leadId)
      .first<{ c: string }>();
    expect(JSON.parse(row!.c)).toMatchObject([{ action: 'qualified', ok: true }]);
  });

  it('records a rejected click id as a permanent failure', async () => {
    vi.stubGlobal('fetch', google({ partialFailureError: { message: 'The click is too old' } }));
    const leadId = await insertLead(ctx.db, { gclid: 'OLD' });
    const [id] = await enqueue(ctx.db, [
      { type: 'ads_conversion', leadId, payload: { action: 'qualified' } },
    ]);
    await runJobs(adsEnv(), { ids: [id!] });
    expect(await job(id!)).toMatchObject({ status: 'failed', attempts: 1 });
    const row = await ctx.db
      .prepare('select conversions_uploaded as c from leads where id = ?')
      .bind(leadId)
      .first<{ c: string }>();
    expect(JSON.parse(row!.c)).toMatchObject([
      { action: 'qualified', ok: false, error: 'The click is too old' },
    ]);
  });

  it('formats times in Riyadh time', () => {
    expect(adsDateTime(new Date('2026-01-31T22:30:00Z'))).toBe('2026-02-01 01:30:00+03:00');
  });
});
