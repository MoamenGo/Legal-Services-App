import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ConsultationCard } from '@/components/ConsultationSection';
import { StickyCta, waLink } from '@/components/ContactButtons';
import { Container, PageTitle } from '@/components/ui';
import { firm } from '@/content/cms';
import { resolveLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'contact' });
  return pageMetadata({
    locale,
    path: '/contact',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations();
  const missing = t('contact.notProvided');
  const rows = [
    {
      label: t('contact.phone'),
      value: firm.phone ? (
        <a
          href={`tel:${firm.phone}`}
          dir="ltr"
          data-event="click_to_call"
          data-location="contact_page"
          className="underline"
        >
          {firm.phone}
        </a>
      ) : (
        missing
      ),
    },
    {
      label: t('contact.whatsapp'),
      value: firm.whatsapp ? (
        <a
          href={waLink(firm.whatsapp)}
          dir="ltr"
          data-event="whatsapp_click"
          data-location="contact_page"
          rel="noopener"
          className="underline"
        >
          {firm.whatsapp}
        </a>
      ) : (
        missing
      ),
    },
    {
      label: t('contact.email'),
      value: firm.email ? (
        <a href={`mailto:${firm.email}`} className="underline">
          {firm.email}
        </a>
      ) : (
        missing
      ),
    },
    { label: t('contact.address'), value: firm.address(locale) ?? t('footer.address') },
    { label: t('contact.hours'), value: firm.hours(locale) ?? t('contact.hoursValue') },
  ];

  return (
    <>
      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-14">
        <div>
          <PageTitle title={t('contact.title')} intro={t('contact.intro')} />
          <dl className="mt-10 border-t border-line">
            {rows.map((row) => (
              <div
                key={row.label}
                className="grid gap-1 border-b border-line py-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6"
              >
                <dt className="text-muted">{row.label}</dt>
                <dd className="text-lg font-medium break-words text-brand-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <ConsultationCard
          title={t('home.formTitle')}
          intro={t('home.formIntro')}
          location="contact"
        />
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
