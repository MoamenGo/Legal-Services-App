import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ConsultationCard } from '@/components/ConsultationSection';
import { StickyCta } from '@/components/ContactButtons';
import { JsonLd, breadcrumbLd, faqPageLd } from '@/components/JsonLd';
import { Container, Faq } from '@/components/ui';
import { findService, services } from '@/content/services';
import { Link } from '@/components/LocalLink';
import { routing } from '@/i18n/routing';
import { resolveLocale } from '@/lib/locale';
import { absoluteUrl, pageMetadata } from '@/lib/seo';

type Qa = { q: string; a: string };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => services.map((s) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/services/[slug]'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const service = findService((await params).slug);
  if (!service) return {};
  const t = await getTranslations({ locale, namespace: `services.items.${service.key}` });
  const firm = (await getTranslations({ locale, namespace: 'common' }))('firmName');
  return pageMetadata({
    locale,
    path: `/services/${service.slug}`,
    title: `${t('title')} | ${firm}`,
    description: t('summary'),
  });
}

export default async function ServicePage({ params }: PageProps<'/[locale]/services/[slug]'>) {
  const locale = await resolveLocale(params);
  const service = findService((await params).slug);
  if (!service) notFound();
  const t = await getTranslations();
  const title = t(`services.items.${service.key}.title`);
  const faq = t.raw(`services.items.${service.key}.faq`) as Qa[];

  return (
    <>
      <JsonLd data={faqPageLd(faq)} />
      <JsonLd
        data={breadcrumbLd([
          { name: t('nav.home'), url: absoluteUrl(locale) },
          { name: t('nav.services'), url: absoluteUrl(locale, '/services') },
          { name: title, url: absoluteUrl(locale, `/services/${service.slug}`) },
        ])}
      />
      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-14">
        <article className="space-y-6">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <ol className="flex flex-wrap gap-1">
              <li>
                <Link href="/" className="underline-offset-4 hover:underline">
                  {t('nav.home')}
                </Link>
                <span aria-hidden> / </span>
              </li>
              <li>
                <Link href="/services" className="underline-offset-4 hover:underline">
                  {t('nav.services')}
                </Link>
                <span aria-hidden> / </span>
              </li>
              <li aria-current="page">{title}</li>
            </ol>
          </nav>
          <h1 className="font-display text-4xl font-semibold text-brand-900 sm:text-5xl">
            {title}
          </h1>
          <p className="border-s-4 border-saffron-400 ps-4 text-xl text-ink">
            {t(`services.items.${service.key}.summary`)}
          </p>
          <p className="max-w-3xl text-lg leading-loose text-ink">
            {t(`services.items.${service.key}.body`)}
          </p>
          <section className="pt-6">
            <h2 className="mb-4 font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
              {t('services.faqTitle')}
            </h2>
            <Faq items={faq} />
          </section>
        </article>
        <div className="lg:sticky lg:top-24">
          <ConsultationCard
            title={t('services.formTitle')}
            location={`service_${service.slug}`}
            defaultCaseType={service.key}
          />
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
