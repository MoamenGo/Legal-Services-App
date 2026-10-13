import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Settings } from '@app/schemas';
import type { Locale } from '@/i18n/routing';

export type CmsArticle = {
  slug: string;
  title: { ar: string; en?: string };
  summary: { ar: string; en?: string };
  body: { ar: string; en?: string };
  tags: string[];
  publishedAt: string;
  updatedAt: string;
};

type Cms = { articles: CmsArticle[]; settings: Partial<Settings> };

/**
 * Content edited in /admin, exported from D1 by scripts/export-content.ts just before the build
 * (ADR 0005). Without an export (CI checks, a fresh clone) the site builds with none.
 */
function load(): Cms {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), '.content/cms.json'), 'utf8')) as Cms;
  } catch {
    return { articles: [], settings: {} };
  }
}

export const cms = load();

/** Articles available in a locale: Arabic always, English only when translated. */
export const articlesFor = (locale: Locale) =>
  cms.articles.filter((a) => locale === 'ar' || (a.title.en && a.body.en));

export const localized = (value: { ar: string; en?: string }, locale: Locale) =>
  (locale === 'en' ? value.en : undefined) ?? value.ar;

/** Firm details from Settings; null means not provided yet and the UI hides it. */
export const firm = {
  phone: cms.settings.phone ?? null,
  whatsapp: cms.settings.whatsapp ?? null,
  email: cms.settings.email ?? null,
  address: (locale: Locale) =>
    (locale === 'en' ? cms.settings.address_en : cms.settings.address_ar) ?? null,
  hours: (locale: Locale) =>
    (locale === 'en' ? cms.settings.hours_en : cms.settings.hours_ar) ?? null,
};
