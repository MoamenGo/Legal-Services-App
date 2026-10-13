import type { MetadataRoute } from 'next';
import { services } from '@/content/services';
import { routing } from '@/i18n/routing';
import { absoluteUrl } from '@/lib/seo';

/** Indexable pages only: landing pages and the thank-you page are noindex. */
const paths = [
  '',
  '/about',
  '/services',
  ...services.map((s) => `/services/${s.slug}`),
  '/articles',
  '/contact',
  '/privacy',
  '/terms',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(locale, path),
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(l, path)])),
      },
    })),
  );
}
