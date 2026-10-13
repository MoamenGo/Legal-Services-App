import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestDb, insertUser, testEnv } from '@/server/test/d1';
import { api } from '../../app';

let ctx: Awaited<ReturnType<typeof createTestDb>>;
beforeAll(async () => {
  ctx = await createTestDb();
});
afterAll(() => ctx.dispose());

const post = (
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
  env = testEnv(ctx.db),
) =>
  api.request(
    path,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    env,
  );

const refreshCookie = (res: Response) =>
  /refresh_token=([^;]+)/.exec(res.headers.get('set-cookie') ?? '')?.[1];

describe('auth', () => {
  it('logs in, returns an access token, and sets a strict httpOnly refresh cookie', async () => {
    await insertUser(ctx.db, { role: 'admin', email: 'admin@example.test' });
    const res = await post('/api/auth/login', {
      email: 'ADMIN@example.test',
      password: 'correct horse battery',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { accessToken: string; user: { role: string } };
    expect(body.user.role).toBe('admin');
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api\/auth/);

    const me = await api.request(
      '/api/admin/me',
      { headers: { authorization: `Bearer ${body.accessToken}` } },
      testEnv(ctx.db),
    );
    expect(me.status).toBe(200);

    const audit = await ctx.db
      .prepare("select count(*) as n from audit_log where action = 'auth.login'")
      .first<{ n: number }>();
    expect(audit?.n).toBe(1);
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    await insertUser(ctx.db, { role: 'intake', email: 'intake@example.test' });
    const wrong = await post('/api/auth/login', { email: 'intake@example.test', password: 'nope' });
    const unknown = await post('/api/auth/login', {
      email: 'ghost@example.test',
      password: 'nope',
    });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(await wrong.json()).toEqual(await unknown.json());
  });

  it('locks the account after 5 failed attempts, even for the right password', async () => {
    await insertUser(ctx.db, { role: 'lawyer', email: 'lock@example.test' });
    const statuses = [];
    for (let i = 0; i < 5; i++)
      statuses.push(
        (await post('/api/auth/login', { email: 'lock@example.test', password: 'bad' })).status,
      );
    expect(statuses).toEqual([401, 401, 401, 401, 423]);
    const right = await post('/api/auth/login', {
      email: 'lock@example.test',
      password: 'correct horse battery',
    });
    expect(right.status).toBe(423);
  });

  it('refuses inactive users', async () => {
    await insertUser(ctx.db, { role: 'intake', email: 'off@example.test', active: false });
    expect(
      (
        await post('/api/auth/login', {
          email: 'off@example.test',
          password: 'correct horse battery',
        })
      ).status,
    ).toBe(401);
  });

  it('rotates the refresh token and rejects the old one; logout revokes', async () => {
    await insertUser(ctx.db, { role: 'admin', email: 'rotate@example.test' });
    const first = refreshCookie(
      await post('/api/auth/login', {
        email: 'rotate@example.test',
        password: 'correct horse battery',
      }),
    )!;

    const refreshed = await post('/api/auth/refresh', undefined, {
      cookie: `refresh_token=${first}`,
    });
    expect(refreshed.status).toBe(200);
    const second = refreshCookie(refreshed)!;
    expect(second).not.toBe(first);

    expect(
      (await post('/api/auth/refresh', undefined, { cookie: `refresh_token=${first}` })).status,
    ).toBe(401);

    expect(
      (await post('/api/auth/logout', undefined, { cookie: `refresh_token=${second}` })).status,
    ).toBe(204);
    expect(
      (await post('/api/auth/refresh', undefined, { cookie: `refresh_token=${second}` })).status,
    ).toBe(401);
  });

  it('rejects validation errors, missing tokens, and tampered tokens', async () => {
    expect((await post('/api/auth/login', { email: 'not-an-email' })).status).toBe(400);
    expect((await api.request('/api/admin/me', {}, testEnv(ctx.db))).status).toBe(401);
    const bad = await api.request(
      '/api/admin/me',
      { headers: { authorization: 'Bearer abc.def.ghi' } },
      testEnv(ctx.db),
    );
    expect(bad.status).toBe(401);
  });

  it('is rate limited and reports when no JWT secret is configured', async () => {
    const limited = testEnv(ctx.db, {
      AUTH_RATE_LIMITER: { limit: async () => ({ success: false }) },
    });
    expect(
      (await post('/api/auth/login', { email: 'a@example.test', password: 'x' }, {}, limited))
        .status,
    ).toBe(429);
    const unconfigured = testEnv(ctx.db, { JWT_ACCESS_SECRET: undefined });
    expect(
      (await post('/api/auth/login', { email: 'a@example.test', password: 'x' }, {}, unconfigured))
        .status,
    ).toBe(503);
  });
});
