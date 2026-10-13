import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PageTitle, Prose, Section } from '@/components/ui';
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
        <PageTitle title={t('title')} />
        <div className="mt-8">
          <Prose>
            <p>{t('intro')}</p>
            <h2 className="pt-6 font-display text-2xl font-semibold text-brand-900">
              {t('missionTitle')}
            </h2>
            <p>{t('mission')}</p>
          </Prose>
        </div>
      </Section>
      <Section title={t('teamTitle')} tone="gypsum">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* LawyerCard placeholder: photo, name, title and licence come from the firm. */}
          <article className="overflow-hidden rounded-2xl border border-line bg-white">
            <div
              role="img"
              aria-label={t('lawyerPhotoAlt')}
              className="aspect-[4/3] bg-brand-100"
            />
            <div className="p-5">
              <h3 className="font-display text-xl font-semibold break-words text-brand-900">
                {t('lawyerName')}
              </h3>
              <p className="text-sm break-words text-muted">{t('lawyerRole')}</p>
              <p className="mt-3 break-words">{t('lawyerBio')}</p>
            </div>
          </article>
        </div>
      </Section>
    </>
  );
}
