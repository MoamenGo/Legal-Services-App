/** zod-free so client bundles can import the option lists without pulling in zod. */
export const caseTypes = [
  'family',
  'labor',
  'commercial',
  'criminal',
  'real_estate',
  'other',
] as const;
export const preferredContacts = ['call', 'whatsapp', 'email'] as const;
export const locales = ['ar', 'en'] as const;

export type CaseType = (typeof caseTypes)[number];
export type PreferredContact = (typeof preferredContacts)[number];
export type Locale = (typeof locales)[number];
