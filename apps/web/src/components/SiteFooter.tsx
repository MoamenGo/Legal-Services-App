import { getTranslations } from 'next-intl/server';
import { ConsentSettingsButton } from './ConsentBanner';
import { Link } from './LocalLink';
import { Container } from './ui';

export async function SiteFooter({ minimal = false }: { minimal?: boolean }) {
  const t = await getTranslations();
  const firm = t('common.firmName');
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 pb-24 pt-10 text-sm text-slate-600 md:pb-10">
      <Container className="space-y-4">
        {!minimal && (
          <div className="space-y-1">
            <p className="font-bold text-brand-900">{firm}</p>
            <p>{t('footer.address')}</p>
          </div>
        )}
        <p>{t('footer.license')}</p>
        <p className="max-w-3xl">{t('footer.disclaimer')}</p>
        <nav className="flex flex-wrap gap-x-4">
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
        <p>{t('footer.rights', { year: new Date().getFullYear(), firm })}</p>
        <p className="text-xs text-slate-500">{t('common.templateNotice')}</p>
      </Container>
    </footer>
  );
}
