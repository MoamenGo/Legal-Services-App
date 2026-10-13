import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LegalPage } from '@/components/LegalPage';
import { resolveLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/privacy'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'privacy' });
  return pageMetadata({
    locale,
    path: '/privacy',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function PrivacyPage({ params }: PageProps<'/[locale]/privacy'>) {
  await resolveLocale(params);
  return <LegalPage namespace="privacy" />;
}
