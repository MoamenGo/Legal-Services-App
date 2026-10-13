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
  // The hero headline is the LCP element, so its face must never swap in late: preloaded, and
  // `optional` keeps the fallback for that visit when the font is slow (cached for the next one).
  display: 'optional',
  preload: true,
  variable: '--font-reem-kufi',
});
