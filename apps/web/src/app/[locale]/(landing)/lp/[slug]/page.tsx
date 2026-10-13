import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ConsultationCard } from '@/components/ConsultationSection';
import { StickyCta } from '@/components/ContactButtons';
import { JsonLd, faqPageLd } from '@/components/JsonLd';
import { Container, Faq, Section, Steps, TrustBadges, buttonClass } from '@/components/ui';
import { findLandingPage, landingPages } from '@/content/landing-pages';
import { routing } from '@/i18n/routing';
import { resolveLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

type Qa = { q: string; a: string };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => landingPages.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/lp/[slug]'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const page = findLandingPage((await params).slug);
  if (!page) return {};
  const t = await getTranslations({ locale, namespace: `landing.pages.${page.slug}` });
  // Paid traffic only: keep landing pages out of search results.
  return pageMetadata({
    locale,
    path: `/lp/${page.slug}`,
    title: t('metaTitle'),
    description: t('subheadline'),
    noindex: true,
  });
}

export default async function LandingPage({ params }: PageProps<'/[locale]/lp/[slug]'>) {
  await resolveLocale(params);
  const page = findLandingPage((await params).slug);
  if (!page) notFound();
  const t = await getTranslations();
  const faq = [
    ...(t.raw(`services.items.${page.service}.faq`) as Qa[]),
    ...(t.raw('faq.items') as Qa[]),
  ];
  const location = `lp_${page.slug}`;

  return (
    <>
      <JsonLd data={faqPageLd(faq)} />
      <div className="bg-gradient-to-b from-brand-50 to-white">
        {/* On mobile the form follows a two-line hero so it sits above the fold at 360px. */}
        <Container className="grid gap-5 py-5 sm:py-10 lg:grid-cols-[1fr_26rem] lg:items-start lg:gap-8">
          <div className="space-y-2 lg:space-y-4 lg:pt-8">
            <h1 className="text-2xl font-bold leading-snug text-brand-900 sm:text-4xl">
              {t(`landing.pages.${page.slug}.headline`)}
            </h1>
            <p className="text-slate-600 sm:text-lg">
              {t(`landing.pages.${page.slug}.subheadline`)}
            </p>
          </div>
          <ConsultationCard
            title={t('landing.formTitle')}
            location={location}
            defaultCaseType={page.service}
            variant="short"
          />
        </Container>
      </div>

      <Section title={t('trust.title')} className="bg-slate-50">
        <TrustBadges items={t.raw('trust.items') as { label: string; value: string }[]} />
      </Section>

      <Section title={t('steps.title')}>
        <Steps items={t.raw('steps.items') as { title: string; body: string }[]} />
      </Section>

      <Section title={t('home.faqTitle')} className="bg-slate-50">
        <Faq items={faq} />
      </Section>

      <Section>
        <div className="rounded-2xl bg-brand-900 p-6 text-center text-white sm:p-10">
          <h2 className="text-2xl font-bold">{t('landing.finalCtaTitle')}</h2>
          <p className="mt-2 text-brand-50">{t('landing.finalCtaBody')}</p>
          <a href="#consultation" className={`${buttonClass.secondary} mt-6 border-white bg-white`}>
            {t('common.ctaConsultation')}
          </a>
        </div>
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
