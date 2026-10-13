import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ConsultationCard } from '@/components/ConsultationSection';
import { StickyCta } from '@/components/ContactButtons';
import { ArrowIcon } from '@/components/icons';
import { JsonLd, faqPageLd } from '@/components/JsonLd';
import { Card, Container, Faq, Section, Steps, TrustBadges } from '@/components/ui';
import { services } from '@/content/services';
import { Link } from '@/components/LocalLink';
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
      <div className="bg-gradient-to-b from-brand-50 to-white">
        <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_26rem] lg:items-start">
          <div className="space-y-4 lg:pt-8">
            <h1 className="text-3xl font-bold leading-snug text-brand-900 sm:text-4xl">
              {t('home.headline')}
            </h1>
            <p className="max-w-xl text-lg text-slate-600">{t('home.subheadline')}</p>
          </div>
          <ConsultationCard
            title={t('home.formTitle')}
            intro={t('home.formIntro')}
            location="home_hero"
          />
        </Container>
      </div>

      <Section title={t('home.servicesTitle')} intro={t('home.servicesIntro')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link key={service.slug} href={`/services/${service.slug}`} className="group block">
              <Card className="h-full transition group-hover:border-brand-700">
                <h3 className="font-bold text-brand-900">
                  {t(`services.items.${service.key}.title`)}
                </h3>
                <p className="mt-1 text-slate-600">{t(`services.items.${service.key}.summary`)}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
                  {t('services.readMore')}
                  <ArrowIcon className="size-4" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      <Section title={t('steps.title')} className="bg-white">
        <Steps items={t.raw('steps.items') as { title: string; body: string }[]} />
      </Section>

      <Section title={t('trust.title')} className="bg-slate-50">
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
