import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/components/LocalLink';
import { PageTitle, Section } from '@/components/ui';
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
      <PageTitle title={t('title')} intro={t('intro')} />
      {items.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-line bg-gypsum p-6 text-muted">
          {t('empty')}
        </p>
      ) : (
        <ul className="mt-12 grid gap-x-10 border-t border-line md:grid-cols-2">
          {items.map((article) => (
            <li key={article.slug} className="border-b border-line py-7">
              <p className="text-sm text-muted">
                {t('published', { date: date.format(new Date(article.publishedAt)) })}
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-brand-900">
                <Link
                  href={`/articles/${article.slug}`}
                  className="underline-offset-8 hover:underline"
                >
                  {localized(article.title, locale)}
                </Link>
              </h2>
              <p className="mt-2 text-muted">{localized(article.summary, locale)}</p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
