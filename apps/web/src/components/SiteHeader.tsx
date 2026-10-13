import { getLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from './LocalLink';
import { LanguageSwitch } from './LanguageSwitch';
import { Container, buttonClass } from './ui';

const navItems = [
  { href: '/', key: 'home' },
  { href: '/about', key: 'about' },
  { href: '/services', key: 'services' },
  { href: '/articles', key: 'articles' },
  { href: '/contact', key: 'contact' },
] as const;

export async function SiteHeader() {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:rounded focus:bg-white focus:p-2"
      >
        {t('common.skipToContent')}
      </a>
      <Container className="flex min-h-16 items-center justify-between gap-3">
        <Link href="/" className="max-w-52 sm:max-w-none">
          <Wordmark name={t('common.firmName')} />
        </Link>
        <nav aria-label={t('nav.menu')} className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-full px-3 font-medium text-ink hover:bg-brand-50"
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <LanguageSwitch locale={locale} label={t('common.switchLanguage')} />
          <Link href="/contact" className={`${buttonClass.primary} ms-2 max-lg:hidden`}>
            {t('common.ctaConsultation')}
          </Link>
          {/* Mobile menu: works without JavaScript. */}
          <details className="relative md:hidden">
            <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-full border border-brand-900 px-4 text-sm font-bold text-brand-900 [&::-webkit-details-marker]:hidden">
              {t('nav.menu')}
            </summary>
            <nav
              aria-label={t('nav.menu')}
              className="absolute end-0 mt-2 flex w-60 flex-col rounded-2xl border border-line bg-white p-2 shadow-[0_12px_32px_-12px_rgb(19_59_53/0.35)]"
            >
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex min-h-11 items-center rounded-xl px-3 font-medium hover:bg-brand-50"
                >
                  {t(`nav.${item.key}`)}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </Container>
    </header>
  );
}

/** Landing-page header: the firm name only, not linked, so paid visitors stay on the page. */
export async function LandingHeader() {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  return (
    <header className="border-b border-line bg-white">
      <Container className="flex min-h-14 items-center justify-between gap-3">
        <Wordmark name={t('common.firmName')} />
        <LanguageSwitch locale={locale} label={t('common.switchLanguage')} />
      </Container>
    </header>
  );
}

/**
 * Firm name in the display face, after a single parapet tooth. A stand-in until the firm's own
 * logo arrives (docs/content-needed.md).
 */
function Wordmark({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 24 20" aria-hidden className="h-5 w-6 shrink-0 text-brand-900">
        <path d="M12 0 24 20H0Z" fill="currentColor" />
        <path d="M12 9.5 15.5 16h-7Z" fill="var(--color-saffron-400)" />
      </svg>
      <span className="line-clamp-2 font-display text-base font-semibold leading-snug text-brand-900 sm:text-lg">
        {name}
      </span>
    </span>
  );
}
