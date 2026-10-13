import { IBM_Plex_Sans_Arabic, Reem_Kufi } from 'next/font/google';

/** Self-hosted at build time by next/font; shared by the public site and /admin. */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-plex-arabic',
});

/**
 * Display face for headings. A geometric Kufi echoes the Najdi geometry the site's frieze is drawn
 * from, and it has Latin glyphs, so English headings keep the same voice.
 */
export const reemKufi = Reem_Kufi({
  subsets: ['arabic', 'latin'],
  weight: 'variable',
  // The hero headline is the LCP element, so its face must never swap in late: `optional` keeps
  // the fallback for that page view when the font is not ready, and the font is cached for the
  // next one. Not preloaded: on slow 4G the 32 KB preload competed with the CSS and pushed LCP
  // past 2.5 s on the live Lighthouse runs.
  display: 'optional',
  preload: false,
  variable: '--font-reem-kufi',
});
