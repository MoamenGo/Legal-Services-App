import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageTitle, Section, ServiceIndex } from '@/components/ui';
import { services } from '@/content/services';
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
      <PageTitle title={t('title')} intro={t('intro')} />
      <div className="mt-12">
        <ServiceIndex
          headingLevel="h2"
          items={services.map((service) => ({
            href: `/services/${service.slug}`,
            title: t(`items.${service.key}.title`),
            summary: t(`items.${service.key}.summary`),
          }))}
        />
      </div>
    </Section>
  );
}
