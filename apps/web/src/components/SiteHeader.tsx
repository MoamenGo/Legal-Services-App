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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:rounded focus:bg-white focus:p-2"
      >
        {t('common.skipToContent')}
      </a>
      <Container className="flex min-h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="line-clamp-2 max-w-48 text-sm font-bold text-brand-900 sm:max-w-none sm:text-base"
        >
          {t('common.firmName')}
        </Link>
        <nav aria-label={t('nav.menu')} className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-md px-3 text-slate-700 hover:bg-slate-100"
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <LanguageSwitch locale={locale} label={t('common.switchLanguage')} />
          <Link href="/contact" className={`${buttonClass.primary} hidden md:inline-flex`}>
            {t('common.ctaConsultation')}
          </Link>
          {/* Mobile menu: works without JavaScript. */}
          <details className="relative md:hidden">
            <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md border border-slate-300 px-3 text-sm">
              {t('nav.menu')}
            </summary>
            <nav
              aria-label={t('nav.menu')}
              className="absolute end-0 mt-2 flex w-56 flex-col rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
            >
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex min-h-11 items-center rounded px-3 hover:bg-slate-100"
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
    <header className="border-b border-slate-200 bg-white">
      <Container className="flex min-h-14 items-center justify-between gap-3">
        <span className="text-sm font-bold text-brand-900 sm:text-base">
          {t('common.firmName')}
        </span>
        <LanguageSwitch locale={locale} label={t('common.switchLanguage')} />
      </Container>
    </header>
  );
}
