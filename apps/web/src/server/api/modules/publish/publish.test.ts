import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { bearer } from '@/server/test/auth';
import { createTestDb, insertUser, testEnv } from '@/server/test/d1';
import { api } from '../../app';

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let admin = '';
beforeAll(async () => {
  ctx = await createTestDb();
  admin = await insertUser(ctx.db, { role: 'admin', email: 'admin@example.test' });
});
afterAll(() => ctx.dispose());
afterEach(() => vi.unstubAllGlobals());

const configured = {
  GITHUB_DEPLOY_TOKEN: 'ghp_test',
  GITHUB_REPOSITORY: 'owner/repo',
  REVALIDATE_SECRET: 'shared-secret',
};

describe('publish', () => {
  it('starts the Deploy workflow on main', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await api.request(
      '/api/admin/publish',
      { method: 'POST', headers: await bearer(admin, 'admin') },
      testEnv(ctx.db, configured),
    );
    expect(res.status).toBe(202);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(
      'https://api.github.com/repos/owner/repo/actions/workflows/deploy.yml/dispatches',
    );
    expect(JSON.parse(init.body as string)).toEqual({ ref: 'main' });
  });

  it('says when it is not configured or GitHub refuses', async () => {
    const headers = await bearer(admin, 'admin');
    expect(
      (await api.request('/api/admin/publish', { method: 'POST', headers }, testEnv(ctx.db)))
        .status,
    ).toBe(503);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 403 })),
    );
    expect(
      (
        await api.request(
          '/api/admin/publish',
          { method: 'POST', headers },
          testEnv(ctx.db, configured),
        )
      ).status,
    ).toBe(502);
  });

  it('accepts the webhook only with the shared secret', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    const hook = (secret?: string) =>
      api.request(
        '/api/webhooks/revalidate',
        { method: 'POST', headers: secret ? { 'x-revalidate-secret': secret } : {} },
        testEnv(ctx.db, configured),
      );
    expect((await hook()).status).toBe(401);
    expect((await hook('wrong')).status).toBe(401);
    expect((await hook('shared-secret')).status).toBe(202);
  });
});
