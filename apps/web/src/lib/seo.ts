import type { Metadata } from 'next';
import { site } from '@/content/site';
import { routing, type Locale } from '@/i18n/routing';

export const absoluteUrl = (locale: Locale, path = '') => `${site.url}/${locale}${path}`;

/** Title, description, canonical and hreflang alternates for one localized page. */
export function pageMetadata({
  locale,
  path = '',
  title,
  description,
  noindex = false,
  locales = routing.locales,
  type = 'website',
}: {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  noindex?: boolean;
  /** Locales the page exists in, for hreflang (an article may be Arabic only). */
  locales?: readonly Locale[];
  type?: 'website' | 'article';
}): Metadata {
  const languages = Object.fromEntries(locales.map((l) => [l, absoluteUrl(l, path)]));
  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(locale, path),
      languages: { ...languages, 'x-default': absoluteUrl(routing.defaultLocale, path) },
    },
    openGraph: { title, description, url: absoluteUrl(locale, path), locale, type },
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}
