import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/components/LocalLink';
import { Card, Section } from '@/components/ui';
import { articlesFor, localized } from '@/content/cms';
import { resolveLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/articles'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'articles' });
  return pageMetadata({
    locale,
    path: '/articles',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

/** Published articles, exported from the admin CMS at build time (ADR 0005). */
export default async function ArticlesPage({ params }: PageProps<'/[locale]/articles'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations('articles');
  const items = articlesFor(locale);
  const date = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    dateStyle: 'long',
    timeZone: 'Asia/Riyadh',
  });
  return (
    <Section>
      <h1 className="text-3xl font-bold text-brand-900">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t('intro')}</p>
      {items.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">
          {t('empty')}
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((article) => (
            <li key={article.slug}>
              <Card className="h-full">
                <p className="text-sm text-slate-500">
                  {t('published', { date: date.format(new Date(article.publishedAt)) })}
                </p>
                <h2 className="mt-1 text-xl font-bold text-brand-900">
                  <Link href={`/articles/${article.slug}`} className="hover:underline">
                    {localized(article.title, locale)}
                  </Link>
                </h2>
                <p className="mt-2 text-slate-600">{localized(article.summary, locale)}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
