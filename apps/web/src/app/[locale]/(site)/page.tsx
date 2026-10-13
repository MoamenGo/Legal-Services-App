import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ConsultationCard } from '@/components/ConsultationSection';
import { StickyCta } from '@/components/ContactButtons';
import { JsonLd, faqPageLd } from '@/components/JsonLd';
import { Faq, Hero, Section, ServiceIndex, Steps, TrustBadges } from '@/components/ui';
import { services } from '@/content/services';
import { resolveLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

type Qa = { q: string; a: string };

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'home' });
  return pageMetadata({ locale, title: t('metaTitle'), description: t('metaDescription') });
}

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  await resolveLocale(params);
  const t = await getTranslations();
  const faq = t.raw('faq.items') as Qa[];

  return (
    <>
      <JsonLd data={faqPageLd(faq)} />
      <Hero title={t('home.headline')} intro={t('home.subheadline')}>
        <ConsultationCard
          title={t('home.formTitle')}
          intro={t('home.formIntro')}
          location="home_hero"
        />
      </Hero>

      <Section title={t('home.servicesTitle')} intro={t('home.servicesIntro')}>
        <ServiceIndex
          items={services.map((service) => ({
            href: `/services/${service.slug}`,
            title: t(`services.items.${service.key}.title`),
            summary: t(`services.items.${service.key}.summary`),
          }))}
        />
      </Section>

      <Section title={t('steps.title')} tone="gypsum">
        <Steps items={t.raw('steps.items') as { title: string; body: string }[]} />
      </Section>

      <Section title={t('trust.title')} tone="pine">
        <TrustBadges items={t.raw('trust.items') as { label: string; value: string }[]} />
      </Section>

      <Section title={t('home.faqTitle')}>
        <Faq items={faq} />
      </Section>

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
