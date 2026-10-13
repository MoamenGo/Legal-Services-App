/**
 * Writes published articles and firm settings from D1 to .content/cms.json, which the static pages
 * read at build time (ADR 0005). The deploy workflow runs it with --remote before building.
 *
 *   pnpm content:export --local     (after pnpm seed or editing in a local /admin)
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const target = process.argv.includes('--remote') ? '--remote' : '--local';

function query<T>(sql: string): T[] {
  const out = execFileSync(
    'npx',
    ['wrangler', 'd1', 'execute', 'DB', target, '--json', '--command', sql],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  return (JSON.parse(out) as { results: T[] }[])[0]?.results ?? [];
}

const json = <T>(value: string | null, fallback: T): T => {
  try {
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
};

type ArticleRow = {
  slug: string;
  title: string;
  summary: string;
  body: string;
  tags: string;
  published_at: number | null;
  updated_at: number;
};

const articles = query<ArticleRow>(
  'SELECT slug, title, summary, body, tags, published_at, updated_at FROM articles WHERE published = 1 ORDER BY published_at DESC',
).map((row) => ({
  slug: row.slug,
  title: json(row.title, { ar: '' }),
  summary: json(row.summary, { ar: '' }),
  body: json(row.body, { ar: '' }),
  tags: json<string[]>(row.tags, []),
  publishedAt: new Date((row.published_at ?? row.updated_at) * 1000).toISOString(),
  updatedAt: new Date(row.updated_at * 1000).toISOString(),
}));

const settings = Object.fromEntries(
  query<{ key: string; value: string | null }>('SELECT key, value FROM settings').map((row) => [
    row.key,
    json(row.value, null),
  ]),
);

mkdirSync('.content', { recursive: true });
writeFileSync('.content/cms.json', JSON.stringify({ articles, settings }, null, 2) + '\n');
console.info(
  `Exported ${articles.length} published articles and ${Object.keys(settings).length} settings (${target}).`,
);
