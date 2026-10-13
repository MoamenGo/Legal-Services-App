import { IBM_Plex_Sans_Arabic, Reem_Kufi } from 'next/font/google';

/**
 * Self-hosted at build time by next/font; shared by the public site and /admin. No 500 weight:
 * each weight is two more files on the critical path, and `font-medium` falls back to 400.
 * `optional` rather than `swap` (ADR 0008): a late swap re-wrapped the hero intro and pushed the
 * form down (CLS 0.118 on /en); the font is cached for the next page either way.
 */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  display: 'optional',
  preload: false,
  variable: '--font-plex-arabic',
});

/**
 * Display face for headings. A geometric Kufi echoes the Najdi geometry the site's frieze is drawn
 * from, and it has Latin glyphs, so English headings keep the same voice.
 */
export const reemKufi = Reem_Kufi({
  subsets: ['arabic', 'latin'],
  weight: '600',
  // The hero headline is the LCP element, so its face must never swap in late: `optional` keeps
  // the fallback for that page view when the font is not ready, and the font is cached for the
  // next one. Not preloaded: on slow 4G the 32 KB preload competed with the CSS and pushed LCP
  // past 2.5 s on the live Lighthouse runs.
  display: 'optional',
  preload: false,
  variable: '--font-reem-kufi',
});
