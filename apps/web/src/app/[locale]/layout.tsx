import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { JsonLd } from '@/components/JsonLd';
import { site } from '@/content/site';
import { directionOf, routing } from '@/i18n/routing';
import { resolveLocale } from '@/lib/locale';
import { absoluteUrl } from '@/lib/seo';
import { plexArabic } from '../fonts';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { metadataBase: new URL(site.url), title: t('title'), description: t('description') };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await resolveLocale(params);
  const t = await getTranslations('common');

  return (
    <html lang={locale} dir={directionOf(locale)} className={plexArabic.variable}>
      <body className="flex min-h-dvh flex-col font-sans">
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'LegalService',
            name: t('firmName'),
            url: absoluteUrl(locale),
            areaServed: { '@type': 'Country', name: 'Saudi Arabia' },
            ...(site.phone ? { telephone: site.phone } : {}),
            ...(site.email ? { email: site.email } : {}),
          }}
        />
        {/* No i18n runtime ships to the browser: client components get server-rendered strings. */}
        {children}
      </body>
    </html>
  );
}
