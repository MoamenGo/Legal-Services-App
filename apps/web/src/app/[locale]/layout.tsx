import type { Metadata } from 'next';
import Script from 'next/script';
import { getTranslations } from 'next-intl/server';
import { ConsentBanner } from '@/components/ConsentBanner';
import { JsonLd } from '@/components/JsonLd';
import { SiteTracking } from '@/components/SiteTracking';
import { firm } from '@/content/cms';
import { site } from '@/content/site';
import { directionOf, routing } from '@/i18n/routing';
import { resolveLocale } from '@/lib/locale';
import { consentDefaultScript } from '@/lib/consent';
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
  const tc = await getTranslations('consent');

  return (
    <html lang={locale} dir={directionOf(locale)} className={plexArabic.variable}>
      <head>
        {/* Consent defaults must exist before GTM loads (Consent Mode v2). */}
        <script dangerouslySetInnerHTML={{ __html: consentDefaultScript }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans">
        {site.gtmId && (
          <>
            {/* GTM is the only tag loaded directly; GA4 and Ads live inside it (AGENTS.md section 8). */}
            <Script id="gtm" strategy="afterInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${site.gtmId}');`}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${site.gtmId}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
                title="GTM"
              />
            </noscript>
          </>
        )}
        <SiteTracking />
        <ConsentBanner
          privacyHref={`/${locale}/privacy`}
          labels={{
            title: tc('title'),
            body: tc('body'),
            accept: tc('accept'),
            reject: tc('reject'),
            privacy: tc('privacy'),
          }}
        />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'LegalService',
            name: t('firmName'),
            url: absoluteUrl(locale),
            areaServed: { '@type': 'Country', name: 'Saudi Arabia' },
            ...(firm.phone ? { telephone: firm.phone } : {}),
            ...(firm.email ? { email: firm.email } : {}),
          }}
        />
        {/* No i18n runtime ships to the browser: client components get server-rendered strings. */}
        {children}
      </body>
    </html>
  );
}
