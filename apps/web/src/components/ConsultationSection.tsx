import { caseTypes, preferredContacts, type CaseType } from '@app/schemas/constants';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import { Link } from './LocalLink';
import { ConsultationForm, type ConsultationFormLabels } from './ConsultationForm';
import { Card } from './ui';

async function formLabels(): Promise<ConsultationFormLabels> {
  const t = await getTranslations('form');
  const errorKeys = [
    'name',
    'phone',
    'email',
    'caseType',
    'message',
    'privacyAccepted',
    'captcha',
    'rateLimited',
    'generic',
  ] as const;
  return {
    name: t('name'),
    phone: t('phone'),
    phoneHint: t('phoneHint'),
    caseType: t('caseType'),
    caseTypePlaceholder: t('caseTypePlaceholder'),
    caseTypes: Object.fromEntries(
      caseTypes.map((k) => [k, t(`caseTypes.${k}`)]),
    ) as ConsultationFormLabels['caseTypes'],
    message: t('message'),
    email: t('email'),
    preferredContact: t('preferredContact'),
    preferredContacts: Object.fromEntries(
      preferredContacts.map((k) => [k, t(`preferredContacts.${k}`)]),
    ) as ConsultationFormLabels['preferredContacts'],
    privacy: t.rich('privacy', {
      link: (chunks) => (
        <Link href="/privacy" className="text-brand-700 underline" target="_blank">
          {chunks}
        </Link>
      ),
    }),
    marketing: t('marketing'),
    website: t('website'),
    submit: t('submit'),
    submitting: t('submitting'),
    verifying: t('verifying'),
    errors: Object.fromEntries(
      errorKeys.map((k) => [k, t(`errors.${k}`)]),
    ) as ConsultationFormLabels['errors'],
  };
}

/** The `#consultation` anchor every "Request a consultation" button points to. */
export async function ConsultationCard({
  title,
  intro,
  location,
  defaultCaseType,
  variant,
}: {
  title: string;
  intro?: string;
  location: string;
  defaultCaseType?: CaseType;
  variant?: 'short' | 'full';
}) {
  return (
    <Card id="consultation" className="scroll-mt-24 p-5 sm:p-6">
      <h2 className="text-xl font-bold text-brand-900">{title}</h2>
      {intro && <p className="mt-1 text-slate-600">{intro}</p>}
      <div className="mt-4">
        <ConsultationForm
          locale={(await getLocale()) as Locale}
          labels={await formLabels()}
          location={location}
          defaultCaseType={defaultCaseType}
          variant={variant}
        />
      </div>
    </Card>
  );
}
