import type { ArticleInput } from '@app/schemas';
import { and, desc, eq } from 'drizzle-orm';
import { createDb } from '@/server/db/client';
import { articles, users } from '@/server/db/schema';
import { uuidv7 } from '@/server/lib/uuid';

const listColumns = {
  id: articles.id,
  slug: articles.slug,
  title: articles.title,
  summary: articles.summary,
  tags: articles.tags,
  published: articles.published,
  publishedAt: articles.publishedAt,
  updatedAt: articles.updatedAt,
};

export const listPublished = (d1: D1Database) =>
  createDb(d1)
    .select(listColumns)
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.publishedAt));

export const findPublished = async (d1: D1Database, slug: string) =>
  (await createDb(d1).query.articles.findFirst({
    where: and(eq(articles.slug, slug), eq(articles.published, true)),
  })) ?? null;

export const listAll = (d1: D1Database) =>
  createDb(d1)
    .select({ ...listColumns, author: users.name })
    .from(articles)
    .leftJoin(users, eq(users.id, articles.authorId))
    .orderBy(desc(articles.updatedAt));

export const findById = async (d1: D1Database, id: string) =>
  (await createDb(d1).query.articles.findFirst({ where: eq(articles.id, id) })) ?? null;

export async function createArticle(d1: D1Database, input: ArticleInput, authorId: string) {
  const id = uuidv7();
  const now = new Date();
  await createDb(d1)
    .insert(articles)
    .values({
      id,
      ...input,
      authorId,
      publishedAt: input.published ? now : null,
      createdAt: now,
      updatedAt: now,
    });
  return id;
}

export async function updateArticle(
  d1: D1Database,
  id: string,
  input: Partial<ArticleInput>,
  wasPublished: boolean,
) {
  const now = new Date();
  await createDb(d1)
    .update(articles)
    .set({
      ...input,
      // The first publish sets the date; edits after that keep it.
      ...(input.published && !wasPublished ? { publishedAt: now } : {}),
      updatedAt: now,
    })
    .where(eq(articles.id, id));
}

export const deleteArticle = (d1: D1Database, id: string) =>
  createDb(d1).delete(articles).where(eq(articles.id, id));
