import { IBM_Plex_Sans_Arabic } from 'next/font/google';

/** Self-hosted at build time by next/font; shared by the public site and /admin. */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: false,
  variable: '--font-plex-arabic',
});
