import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ArticleBody } from '@/components/ArticleBody';
import { ConsultationCard } from '@/components/ConsultationSection';
import { StickyCta } from '@/components/ContactButtons';
import { JsonLd, breadcrumbLd } from '@/components/JsonLd';
import { Link } from '@/components/LocalLink';
import { Container } from '@/components/ui';
import { articlesFor, localized } from '@/content/cms';
import { routing, type Locale } from '@/i18n/routing';
import { resolveLocale } from '@/lib/locale';
import { absoluteUrl, pageMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    articlesFor(locale).map((a) => ({ locale, slug: a.slug })),
  );
}

const find = (locale: Locale, slug: string) => articlesFor(locale).find((a) => a.slug === slug);
const localesOf = (slug: string) => routing.locales.filter((l) => find(l, slug));

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/articles/[slug]'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const article = find(locale, slug);
  if (!article) return {};
  const firm = (await getTranslations({ locale, namespace: 'common' }))('firmName');
  return pageMetadata({
    locale,
    path: `/articles/${slug}`,
    title: `${localized(article.title, locale)} | ${firm}`,
    description: localized(article.summary, locale),
    locales: localesOf(slug),
    type: 'article',
  });
}

export default async function ArticlePage({ params }: PageProps<'/[locale]/articles/[slug]'>) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const article = find(locale, slug);
  if (!article) notFound();
  const t = await getTranslations();
  const title = localized(article.title, locale);
  const published = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB',
    {
      dateStyle: 'long',
      timeZone: 'Asia/Riyadh',
    },
  ).format(new Date(article.publishedAt));

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: title,
          description: localized(article.summary, locale),
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          inLanguage: locale,
          mainEntityOfPage: absoluteUrl(locale, `/articles/${slug}`),
          publisher: { '@type': 'LegalService', name: t('common.firmName') },
        }}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: t('nav.home'), url: absoluteUrl(locale) },
          { name: t('articles.title'), url: absoluteUrl(locale, '/articles') },
          { name: title, url: absoluteUrl(locale, `/articles/${slug}`) },
        ])}
      />
      <Container className="py-12 sm:py-16">
        <article className="mx-auto max-w-3xl">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <Link href="/articles" className="hover:underline">
              {t('articles.back')}
            </Link>
          </nav>
          <h1 className="mt-4 font-display text-4xl font-semibold text-brand-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-muted">{t('articles.published', { date: published })}</p>
          <div className="mt-8">
            <ArticleBody text={localized(article.body, locale)} />
          </div>
          <p className="mt-12 border-s-4 border-saffron-400 bg-gypsum p-4 text-sm text-muted">
            {t('articles.disclaimer')}
          </p>
        </article>
        <div className="mx-auto mt-12 max-w-3xl">
          <ConsultationCard title={t('services.formTitle')} location={`article_${slug}`} />
        </div>
      </Container>
      <StickyCta
        labels={{
          call: t('common.call'),
          whatsapp: t('common.whatsapp'),
          consultation: t('common.ctaConsultation'),
        }}
      />
    </>
  );
}
