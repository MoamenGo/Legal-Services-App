import { getTranslations } from 'next-intl/server';
import { Section, buttonClass } from '@/components/ui';
import { Link } from '@/components/LocalLink';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <Section>
      <div className="mx-auto max-w-xl py-8 text-center">
        <p className="text-5xl font-bold text-accent-500">404</p>
        <h1 className="mt-4 text-3xl font-bold text-brand-900">{t('title')}</h1>
        <p className="mt-3 text-slate-600">{t('body')}</p>
        <Link href="/" className={`${buttonClass.secondary} mt-8`}>
          {t('backHome')}
        </Link>
      </div>
    </Section>
  );
}
