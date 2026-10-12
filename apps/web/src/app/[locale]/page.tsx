import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const otherLocale = locale === 'ar' ? 'en' : 'ar';

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <header className="flex items-center justify-between">
        <span className="text-lg font-bold text-brand-900">{t('firmName')}</span>
        <Link href="/" locale={otherLocale} className="text-sm text-brand-700 underline">
          {t('switchLanguage')}
        </Link>
      </header>
      <h1 className="text-3xl font-bold leading-snug text-brand-900">{t('headline')}</h1>
      <p className="text-lg text-slate-600">{t('subheadline')}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href="#consultation"
          className="min-h-11 rounded-lg bg-brand-900 px-5 py-3 text-base font-medium text-white"
        >
          {t('ctaConsultation')}
        </a>
      </div>
      <p className="text-sm text-slate-500">{t('templateNotice')}</p>
    </main>
  );
}
