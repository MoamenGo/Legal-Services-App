import { z } from 'zod';
import { normalizeSaudiPhone } from './phone';

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

const utm = z.string().trim().max(200).optional();

export const leadSourceSchema = z.object({
  utm_source: utm,
  utm_medium: utm,
  utm_campaign: utm,
  utm_term: utm,
  utm_content: utm,
  gclid: utm,
  gbraid: utm,
  wbraid: utm,
  landingPage: z.string().trim().max(500).optional(),
  referrer: z.string().trim().max(500).optional(),
  device: z.enum(['mobile', 'tablet', 'desktop']).optional(),
});

/** Public lead form payload, shared by the web form and the API. */
export const leadInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .transform((value, ctx) => {
      const e164 = normalizeSaudiPhone(value);
      if (!e164) {
        ctx.addIssue({ code: 'custom', message: 'invalid_phone' });
        return z.NEVER;
      }
      return e164;
    }),
  email: z.email().max(200).optional(),
  caseType: z.enum(caseTypes),
  message: z.string().trim().max(2000).optional(),
  preferredContact: z.enum(preferredContacts).default('call'),
  language: z.enum(locales),
  source: leadSourceSchema.default({}),
  privacyAccepted: z.literal(true),
  marketingConsent: z.boolean().default(false),
  /** Honeypot: real users never fill it. */
  website: z.string().max(0).optional(),
  turnstileToken: z.string().min(1),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
export type LeadInputRaw = z.input<typeof leadInputSchema>;
