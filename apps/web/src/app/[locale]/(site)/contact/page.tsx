import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ConsultationCard } from '@/components/ConsultationSection';
import { StickyCta, waLink } from '@/components/ContactButtons';
import { Container } from '@/components/ui';
import { site } from '@/content/site';
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
  await resolveLocale(params);
  const t = await getTranslations();
  const missing = t('contact.notProvided');
  const rows = [
    {
      label: t('contact.phone'),
      value: site.phone ? (
        <a href={`tel:${site.phone}`} dir="ltr" data-event="click_to_call" className="underline">
          {site.phone}
        </a>
      ) : (
        missing
      ),
    },
    {
      label: t('contact.whatsapp'),
      value: site.whatsapp ? (
        <a
          href={waLink(site.whatsapp)}
          dir="ltr"
          data-event="whatsapp_click"
          rel="noopener"
          className="underline"
        >
          {site.whatsapp}
        </a>
      ) : (
        missing
      ),
    },
    {
      label: t('contact.email'),
      value: site.email ? (
        <a href={`mailto:${site.email}`} className="underline">
          {site.email}
        </a>
      ) : (
        missing
      ),
    },
    { label: t('contact.address'), value: t('footer.address') },
    { label: t('contact.hours'), value: t('contact.hoursValue') },
  ];

  return (
    <>
      <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_26rem] lg:items-start">
        <div>
          <h1 className="text-3xl font-bold text-brand-900">{t('contact.title')}</h1>
          <p className="mt-2 max-w-xl text-slate-600">{t('contact.intro')}</p>
          <dl className="mt-8 space-y-4">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="text-sm text-slate-500">{row.label}</dt>
                <dd className="font-medium break-words text-brand-900">{row.value}</dd>
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
