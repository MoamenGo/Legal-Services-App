import { getTranslations } from 'next-intl/server';
import { PageTitle, Prose, Section } from './ui';

type LegalSection = { title: string; body: string[] };

/** Privacy policy and terms: drafts in messages, reviewed by the firm's counsel before launch. */
export async function LegalPage({ namespace }: { namespace: 'privacy' | 'terms' }) {
  const t = await getTranslations(namespace);
  const sections = t.raw('sections') as LegalSection[];
  return (
    <Section>
      <PageTitle title={t('title')} />
      <p className="mt-4 inline-block rounded-full bg-amber-50 px-4 py-1 text-sm text-amber-900">
        {t('draftNotice')}
      </p>
      <div className="mt-8">
        <Prose>
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="pt-4 font-display text-2xl font-semibold text-brand-900">
                {section.title}
              </h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </Prose>
      </div>
    </Section>
  );
}
