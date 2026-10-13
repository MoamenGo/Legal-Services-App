/** Turnstile's public test key: always passes, works on any hostname. */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

/**
 * Build-time config that client components may import too. Firm contact details come from the
 * admin Settings page instead (content/cms.ts).
 */
export const site = {
  url:
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://legal-services-app.abdelmoamengomaa98.workers.dev',
  /** GTM container id (GTM-XXXXXXX). Without it no tag loads; the consent banner still works. */
  gtmId: process.env.NEXT_PUBLIC_GTM_ID || null,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TURNSTILE_TEST_SITE_KEY,
};
