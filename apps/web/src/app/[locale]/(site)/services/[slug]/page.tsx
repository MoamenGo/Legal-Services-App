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
      <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_26rem] lg:items-start">
        <article className="space-y-6">
          <nav aria-label="breadcrumb" className="text-sm text-slate-500">
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
          <h1 className="text-3xl font-bold text-brand-900 sm:text-4xl">{title}</h1>
          <p className="text-lg text-slate-700">{t(`services.items.${service.key}.summary`)}</p>
          <p className="leading-relaxed text-slate-700">
            {t(`services.items.${service.key}.body`)}
          </p>
          <section>
            <h2 className="mb-4 text-2xl font-bold text-brand-900">{t('services.faqTitle')}</h2>
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
