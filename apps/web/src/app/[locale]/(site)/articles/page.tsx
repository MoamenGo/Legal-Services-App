import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Section } from '@/components/ui';
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

/** Articles are published from the admin CMS (Phase 4); until then the list is empty. */
export default async function ArticlesPage({ params }: PageProps<'/[locale]/articles'>) {
  await resolveLocale(params);
  const t = await getTranslations('articles');
  return (
    <Section>
      <h1 className="text-3xl font-bold text-brand-900">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t('intro')}</p>
      <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-6 text-slate-500">
        {t('empty')}
      </p>
    </Section>
  );
}
