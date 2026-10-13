import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LegalPage } from '@/components/LegalPage';
import { resolveLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/terms'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'terms' });
  return pageMetadata({
    locale,
    path: '/terms',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function TermsPage({ params }: PageProps<'/[locale]/terms'>) {
  await resolveLocale(params);
  return <LegalPage namespace="terms" />;
}
