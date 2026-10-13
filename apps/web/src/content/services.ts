import type { LeadInput } from '@app/schemas';

type CaseType = LeadInput['caseType'];

/** Practice areas. Copy lives in messages/<locale>.json under `services.items.<key>`. */
export const services = [
  { slug: 'family-law', key: 'family' },
  { slug: 'labor-law', key: 'labor' },
  { slug: 'commercial-law', key: 'commercial' },
  { slug: 'criminal-law', key: 'criminal' },
  { slug: 'real-estate-law', key: 'real_estate' },
] as const satisfies readonly { slug: string; key: Exclude<CaseType, 'other'> }[];

export type Service = (typeof services)[number];

export const findService = (slug: string) => services.find((s) => s.slug === slug);

/** Each service page shows this many FAQ entries (`faq.0` … `faq.2`). */
export const serviceFaqCount = 3;
