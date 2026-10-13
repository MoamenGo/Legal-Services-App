import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LeadConversion } from '@/components/LeadConversion';
import { Section, buttonClass } from '@/components/ui';
import { Link } from '@/components/LocalLink';
import { resolveLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/thank-you'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'thankYou' });
  return pageMetadata({
    locale,
    path: '/thank-you',
    title: t('metaTitle'),
    description: t('body'),
    noindex: true,
  });
}

export default async function ThankYouPage({ params }: PageProps<'/[locale]/thank-you'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations('thankYou');
  return (
    <Section>
      <LeadConversion language={locale} />
      <div className="mx-auto max-w-xl py-8 text-center">
        <div
          aria-hidden
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-900 text-3xl text-saffron-400"
        >
          ✓
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold text-brand-900">{t('title')}</h1>
        <p className="mt-4 text-lg text-muted">{t('body')}</p>
        <Link href="/" className={`${buttonClass.secondary} mt-8`}>
          {t('backHome')}
        </Link>
      </div>
    </Section>
  );
}
