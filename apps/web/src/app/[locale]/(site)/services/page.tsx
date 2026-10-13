import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowIcon } from '@/components/icons';
import { Card, Section } from '@/components/ui';
import { services } from '@/content/services';
import { Link } from '@/components/LocalLink';
import { resolveLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/services'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'services' });
  return pageMetadata({
    locale,
    path: '/services',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function ServicesPage({ params }: PageProps<'/[locale]/services'>) {
  await resolveLocale(params);
  const t = await getTranslations('services');
  return (
    <Section>
      <h1 className="text-3xl font-bold text-brand-900">{t('title')}</h1>
      <p className="mt-2 max-w-2xl text-slate-600">{t('intro')}</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <li key={service.slug}>
            <Link href={`/services/${service.slug}`} className="group block h-full">
              <Card className="h-full transition group-hover:border-brand-700">
                <h2 className="text-lg font-bold text-brand-900">
                  {t(`items.${service.key}.title`)}
                </h2>
                <p className="mt-1 text-slate-600">{t(`items.${service.key}.summary`)}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                  {t('readMore')}
                  <ArrowIcon className="size-4" />
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
