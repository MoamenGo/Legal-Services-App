import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer } from '@/server/test/auth';
import { createTestDb, insertUser, testEnv } from '@/server/test/d1';
import { api } from '../../app';

let ctx: Awaited<ReturnType<typeof createTestDb>>;
const ids = { admin: '', intake: '', lawyer: '' };

beforeAll(async () => {
  ctx = await createTestDb();
  ids.admin = await insertUser(ctx.db, { role: 'admin', email: 'admin@example.test' });
  ids.intake = await insertUser(ctx.db, { role: 'intake', email: 'intake@example.test' });
  ids.lawyer = await insertUser(ctx.db, { role: 'lawyer', email: 'lawyer@example.test' });
});
afterAll(() => ctx.dispose());

const call = async (method: string, path: string, as?: keyof typeof ids, body?: unknown) =>
  api.request(
    path,
    {
      method,
      headers: { 'content-type': 'application/json', ...(as ? await bearer(ids[as], as) : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    testEnv(ctx.db),
  );

const draft = {
  slug: 'end-of-service-award',
  title: { ar: 'مكافأة نهاية الخدمة', en: 'End of service award' },
  summary: { ar: 'متى تستحقها وكيف تُحسب.' },
  body: { ar: '## من يستحقها\nنص تجريبي.' },
};

type Article = {
  id: string;
  published: boolean;
  publishedAt: string | null;
  title: { ar: string; en?: string };
};

describe('articles', () => {
  let id = '';

  it('lets intake create a draft that the public cannot see', async () => {
    const res = await call('POST', '/api/admin/articles', 'intake', draft);
    expect(res.status).toBe(201);
    const { article } = (await res.json()) as { article: Article };
    id = article.id;
    expect(article.published).toBe(false);
    expect((await call('GET', `/api/articles/${draft.slug}`)).status).toBe(404);
    expect(
      ((await (await call('GET', '/api/articles')).json()) as { articles: unknown[] }).articles,
    ).toHaveLength(0);
  });

  it('publishes, sets the date once, and shows it publicly', async () => {
    const res = await call('PATCH', `/api/admin/articles/${id}`, 'admin', { published: true });
    const { article } = (await res.json()) as { article: Article };
    expect(article.publishedAt).not.toBeNull();
    const again = (await (
      await call('PATCH', `/api/admin/articles/${id}`, 'admin', { title: { ar: 'عنوان جديد' } })
    ).json()) as { article: Article };
    expect(again.article.publishedAt).toBe(article.publishedAt);
    expect(again.article.title.en).toBeUndefined();
    // Fields left out of an edit keep their values.
    expect(again.article.published).toBe(true);
    const pub = await call('GET', `/api/articles/${draft.slug}`);
    expect(pub.status).toBe(200);
  });

  it('rejects a duplicate slug, bad input, and writes by lawyers', async () => {
    expect((await call('POST', '/api/admin/articles', 'admin', draft)).status).toBe(409);
    expect(
      (await call('POST', '/api/admin/articles', 'admin', { ...draft, slug: 'Bad Slug' })).status,
    ).toBe(400);
    expect(
      (await call('POST', '/api/admin/articles', 'lawyer', { ...draft, slug: 'other' })).status,
    ).toBe(403);
    expect((await call('GET', '/api/admin/articles', 'lawyer')).status).toBe(200);
    expect((await call('GET', '/api/admin/articles')).status).toBe(401);
  });

  it('lets only admins delete', async () => {
    expect((await call('DELETE', `/api/admin/articles/${id}`, 'intake')).status).toBe(403);
    expect((await call('DELETE', `/api/admin/articles/${id}`, 'admin')).status).toBe(204);
    expect((await call('GET', `/api/admin/articles/${id}`, 'admin')).status).toBe(404);
  });
});
