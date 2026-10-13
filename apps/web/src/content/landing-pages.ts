import type { Service } from './services';

/**
 * Google Ads landing pages (`/[locale]/lp/[slug]`). Copy lives in messages under
 * `landing.pages.<slug>`; the headline should mirror the ad group's keyword.
 */
export const landingPages = [
  { slug: 'labor-lawyer', service: 'labor' },
  { slug: 'family-lawyer', service: 'family' },
] as const satisfies readonly { slug: string; service: Service['key'] }[];

export const findLandingPage = (slug: string) => landingPages.find((p) => p.slug === slug);
