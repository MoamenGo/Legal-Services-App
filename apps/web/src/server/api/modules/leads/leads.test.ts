import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../app';
import { createLead } from './service';

vi.mock('./service', () => ({
  createLead: vi.fn(async () => '0190a4c8-0000-7000-8000-000000000000'),
}));

const validLead = {
  name: 'سارة أحمد',
  phone: '0551234567',
  caseType: 'labor',
  language: 'ar',
  privacyAccepted: true,
  turnstileToken: 'token',
  source: { utm_campaign: 'labor-riyadh', gclid: 'test-gclid' },
};

const env = (overrides: { rateLimited?: boolean; secret?: string } = {}) =>
  ({
    DB: {},
    LEAD_RATE_LIMITER: { limit: async () => ({ success: !overrides.rateLimited }) },
    TURNSTILE_SECRET_KEY: overrides.secret,
  }) as unknown as CloudflareEnv;

const post = (body: unknown, e = env()) =>
  api.request(
    '/api/leads',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7' },
      body: JSON.stringify(body),
    },
    e,
  );

const turnstileAnswers = (success: boolean) =>
  vi.fn(async () => new Response(JSON.stringify({ success }), { status: 200 }));

describe('POST /api/leads', () => {
  beforeEach(() => vi.mocked(createLead).mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it('saves a valid lead with the phone normalized to E.164', async () => {
    const fetchMock = turnstileAnswers(true);
    vi.stubGlobal('fetch', fetchMock);
    const res = await post(validLead);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: '0190a4c8-0000-7000-8000-000000000000' });
    expect(createLead).toHaveBeenCalledOnce();
    const saved = vi.mocked(createLead).mock.calls[0]![1];
    expect(saved.phone).toBe('+966551234567');
    expect(saved.source.gclid).toBe('test-gclid');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('rejects invalid input with the shared error shape and no values echoed', async () => {
    vi.stubGlobal('fetch', turnstileAnswers(true));
    const res = await post({ ...validLead, phone: '12345', name: 'x' });
    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: string; details: Record<string, string[]> };
    };
    expect(body.error.code).toBe('validation_error');
    expect(Object.keys(body.error.details).sort()).toEqual(['name', 'phone']);
    expect(JSON.stringify(body)).not.toContain('12345');
    expect(createLead).not.toHaveBeenCalled();
  });

  it('rejects a body that is not JSON', async () => {
    const res = await api.request(
      '/api/leads',
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' },
      env(),
    );
    expect(res.status).toBe(400);
  });

  it('rejects a failed captcha', async () => {
    vi.stubGlobal('fetch', turnstileAnswers(false));
    const res = await post(validLead);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('captcha_failed');
    expect(createLead).not.toHaveBeenCalled();
  });

  it('treats an unreachable captcha verifier as a failed captcha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('network'))),
    );
    const res = await post(validLead);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('captcha_failed');
  });

  it('pretends to accept a filled honeypot but stores nothing', async () => {
    const fetchMock = turnstileAnswers(true);
    vi.stubGlobal('fetch', fetchMock);
    const res = await post({ ...validLead, website: 'https://spam.example' });
    expect(res.status).toBe(201);
    expect(createLead).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 429 when the IP is over the rate limit', async () => {
    const res = await post(validLead, env({ rateLimited: true }));
    expect(res.status).toBe(429);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('rate_limited');
    expect(createLead).not.toHaveBeenCalled();
  });

  it('verifies with the configured secret when one is set', async () => {
    const fetchMock = turnstileAnswers(true);
    vi.stubGlobal('fetch', fetchMock);
    await post(validLead, env({ secret: 'real-secret' }));
    const form = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData;
    expect(form.get('secret')).toBe('real-secret');
    expect(form.get('remoteip')).toBe('203.0.113.7');
  });
});
