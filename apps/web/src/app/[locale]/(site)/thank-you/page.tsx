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
          className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700"
        >
          ✓
        </div>
        <h1 className="mt-4 text-3xl font-bold text-brand-900">{t('title')}</h1>
        <p className="mt-3 text-lg text-slate-600">{t('body')}</p>
        <Link href="/" className={`${buttonClass.secondary} mt-8`}>
          {t('backHome')}
        </Link>
      </div>
    </Section>
  );
}
