import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Card, Prose, Section } from '@/components/ui';
import { resolveLocale } from '@/lib/locale';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/about'>): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: 'about' });
  return pageMetadata({
    locale,
    path: '/about',
    title: t('metaTitle'),
    description: t('metaDescription'),
  });
}

export default async function AboutPage({ params }: PageProps<'/[locale]/about'>) {
  await resolveLocale(params);
  const t = await getTranslations('about');
  return (
    <>
      <Section>
        <h1 className="text-3xl font-bold text-brand-900">{t('title')}</h1>
        <div className="mt-4">
          <Prose>
            <p>{t('intro')}</p>
            <h2 className="pt-4 text-xl font-bold text-brand-900">{t('missionTitle')}</h2>
            <p>{t('mission')}</p>
          </Prose>
        </div>
      </Section>
      <Section title={t('teamTitle')} className="bg-slate-50">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* LawyerCard placeholder: photo, name, title and licence come from the firm. */}
          <Card className="flex gap-4">
            <div
              role="img"
              aria-label={t('lawyerPhotoAlt')}
              className="size-20 shrink-0 rounded-full bg-slate-200"
            />
            <div className="min-w-0">
              <h3 className="font-bold break-words text-brand-900">{t('lawyerName')}</h3>
              <p className="text-sm break-words text-slate-500">{t('lawyerRole')}</p>
              <p className="mt-2 text-sm break-words text-slate-600">{t('lawyerBio')}</p>
            </div>
          </Card>
        </div>
      </Section>
    </>
  );
}
