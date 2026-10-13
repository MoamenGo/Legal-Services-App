import ar from '../../../messages/ar.json';
import en from '../../../messages/en.json';

const bundles = { ar, en };
export type MailLang = keyof typeof bundles;

export const mailLang = (value: string | undefined): MailLang => (value === 'en' ? 'en' : 'ar');

/** Server-side strings for emails, from the same message files as the site. */
export function mailText(lang: MailLang) {
  const m = bundles[lang];
  const fill = (template: string, vars: Record<string, string>) =>
    template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
  return {
    emails: m.emails,
    firm: m.common.firmName,
    caseType: (key: string) => (m.form.caseTypes as Record<string, string>)[key] ?? key,
    contact: (key: string) => (m.form.preferredContacts as Record<string, string>)[key] ?? key,
    fill,
  };
}
