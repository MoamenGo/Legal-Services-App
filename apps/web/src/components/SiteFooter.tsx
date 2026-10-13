import { getLocale, getTranslations } from 'next-intl/server';
import { firm } from '@/content/cms';
import type { Locale } from '@/i18n/routing';
import { ConsentSettingsButton } from './ConsentBanner';
import { Link } from './LocalLink';
import { Container } from './ui';

/** Pine, with the parapet along its top edge, so every page ends on the same wall line. */
export async function SiteFooter({ minimal = false }: { minimal?: boolean }) {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const firmName = t('common.firmName');
  return (
    <footer className="najdi-top on-pine mt-auto bg-brand-900 pb-24 pt-12 text-sm text-brand-100 md:pb-12">
      <Container className="space-y-5">
        {!minimal && (
          <div className="space-y-1">
            <p className="font-display text-xl font-semibold text-white">{firmName}</p>
            <p>{firm.address(locale) ?? t('footer.address')}</p>
          </div>
        )}
        <p>{t('footer.license')}</p>
        <p className="max-w-3xl">{t('footer.disclaimer')}</p>
        <nav className="flex flex-wrap gap-x-5 text-white">
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
          >
            {t('footer.privacy')}
          </Link>
          <Link
            href="/terms"
            className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
          >
            {t('footer.terms')}
          </Link>
          <ConsentSettingsButton label={t('consent.settings')} />
        </nav>
        <div className="space-y-1 border-t border-white/15 pt-5">
          <p>{t('footer.rights', { year: new Date().getFullYear(), firm: firmName })}</p>
          <p className="text-xs text-brand-100/80">{t('common.templateNotice')}</p>
        </div>
      </Container>
    </footer>
  );
}
