import { articleInputSchema, articlePatchSchema } from '@app/schemas';
import { Hono } from 'hono';
import { z } from 'zod';
import { audit } from '../../audit';
import type { ApiEnv } from '../../env';
import { apiError } from '../../errors';
import { requireAuth, requireRole } from '../../middleware/auth';
import {
  createArticle,
  deleteArticle,
  findById,
  findPublished,
  listAll,
  listPublished,
  updateArticle,
} from './service';

export const articlesRoutes = new Hono<ApiEnv>();

const isUnique = (error: unknown) =>
  error instanceof Error && /UNIQUE/i.test(`${error.message} ${String(error.cause ?? '')}`);

// Public, published only (AGENTS.md section 5).
articlesRoutes.get('/articles', async (c) => c.json({ articles: await listPublished(c.env.DB) }));
articlesRoutes.get('/articles/:slug', async (c) => {
  const article = await findPublished(c.env.DB, c.req.param('slug'));
  return article ? c.json({ article }) : apiError(c, 404, 'not_found', 'Article not found');
});

// Lawyers may read content; admin and intake edit it; only admins delete.
articlesRoutes.use('/admin/articles', requireAuth);
articlesRoutes.use('/admin/articles/*', requireAuth);

articlesRoutes.get('/admin/articles', async (c) => c.json({ articles: await listAll(c.env.DB) }));

articlesRoutes.get('/admin/articles/:id', async (c) => {
  const article = await findById(c.env.DB, c.req.param('id'));
  return article ? c.json({ article }) : apiError(c, 404, 'not_found', 'Article not found');
});

articlesRoutes.post('/admin/articles', requireRole('admin', 'intake'), async (c) => {
  const parsed = articleInputSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return apiError(
      c,
      400,
      'validation_error',
      'Invalid article',
      z.flattenError(parsed.error).fieldErrors,
    );
  }
  try {
    const id = await createArticle(c.env.DB, parsed.data, c.get('user').id);
    await audit(c, 'article.create', 'article', id, { published: [null, parsed.data.published] });
    return c.json({ article: await findById(c.env.DB, id) }, 201);
  } catch (error) {
    if (isUnique(error)) return apiError(c, 409, 'slug_taken', 'Another article uses this slug');
    throw error;
  }
});

articlesRoutes.patch('/admin/articles/:id', requireRole('admin', 'intake'), async (c) => {
  const parsed = articlePatchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return apiError(
      c,
      400,
      'validation_error',
      'Invalid article',
      z.flattenError(parsed.error).fieldErrors,
    );
  }
  const before = await findById(c.env.DB, c.req.param('id'));
  if (!before) return apiError(c, 404, 'not_found', 'Article not found');
  try {
    await updateArticle(c.env.DB, before.id, parsed.data, before.published);
  } catch (error) {
    if (isUnique(error)) return apiError(c, 409, 'slug_taken', 'Another article uses this slug');
    throw error;
  }
  // Field names only: article text is not PII but would bloat the log.
  await audit(
    c,
    'article.update',
    'article',
    before.id,
    Object.fromEntries(Object.keys(parsed.data).map((k) => [k, ['…', '…']])),
  );
  return c.json({ article: await findById(c.env.DB, before.id) });
});

articlesRoutes.delete('/admin/articles/:id', requireRole('admin'), async (c) => {
  const before = await findById(c.env.DB, c.req.param('id'));
  if (!before) return apiError(c, 404, 'not_found', 'Article not found');
  await deleteArticle(c.env.DB, before.id);
  await audit(c, 'article.delete', 'article', before.id, { slug: [before.slug, null] });
  return c.body(null, 204);
});
