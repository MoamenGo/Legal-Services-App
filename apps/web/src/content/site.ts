/** Turnstile's public test key: always passes, works on any hostname. */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

/**
 * Firm settings used by prerendered pages. They live in code until the admin Settings module
 * (Phase 4) stores them in D1; values the firm has not given yet stay null and their UI is hidden.
 */
export const site = {
  url:
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://legal-services-app.abdelmoamengomaa98.workers.dev',
  /** E.164, e.g. +9665XXXXXXXX. [CLIENT TO PROVIDE] */
  phone: null as string | null,
  /** E.164 WhatsApp Business number. [CLIENT TO PROVIDE] */
  whatsapp: null as string | null,
  /** [CLIENT TO PROVIDE] */
  email: null as string | null,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TURNSTILE_TEST_SITE_KEY,
};
