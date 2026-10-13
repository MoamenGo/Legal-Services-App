import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ConsultationCard } from '@/components/ConsultationSection';
import { StickyCta } from '@/components/ContactButtons';
import { JsonLd, faqPageLd } from '@/components/JsonLd';
import { Faq, Hero, Section, Steps, TrustBadges, buttonClass } from '@/components/ui';
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
      {/* On mobile the form follows a short hero so it starts above the fold at 360px. */}
      <Hero
        compact
        title={t(`landing.pages.${page.slug}.headline`)}
        intro={t(`landing.pages.${page.slug}.subheadline`)}
      >
        <ConsultationCard
          title={t('landing.formTitle')}
          location={location}
          defaultCaseType={page.service}
          variant="short"
        />
      </Hero>

      <Section title={t('trust.title')} tone="pine" className="pt-4 sm:pt-6">
        <TrustBadges items={t.raw('trust.items') as { label: string; value: string }[]} />
      </Section>

      <Section title={t('steps.title')}>
        <Steps items={t.raw('steps.items') as { title: string; body: string }[]} />
      </Section>

      <Section title={t('home.faqTitle')} tone="gypsum">
        <Faq items={faq} />
      </Section>

      <Section>
        <div className="najdi-top on-pine rounded-b-3xl bg-brand-900 px-6 py-10 text-center text-white sm:px-12 sm:py-14">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            {t('landing.finalCtaTitle')}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-lg text-brand-100">
            {t('landing.finalCtaBody')}
          </p>
          <a href="#consultation" className={`${buttonClass.saffron} mt-8`}>
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
