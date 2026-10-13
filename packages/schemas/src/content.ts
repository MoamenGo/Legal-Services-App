import { z } from 'zod';
import { normalizeSaudiPhone } from './phone';

/** URL slug: lowercase latin letters, digits and single hyphens. */
export const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'invalid_slug');

/** Arabic is required (the default locale); English is optional and the page is Arabic-only without it. */
const localized = (max: number) =>
  z.object({
    ar: z.string().trim().min(1).max(max),
    en: z
      .string()
      .trim()
      .max(max)
      .optional()
      .transform((v) => v || undefined),
  });

const articleFields = z.object({
  slug: slugSchema,
  title: localized(160),
  summary: localized(300),
  body: localized(20_000),
  tags: z.array(z.string().trim().min(1).max(40)).max(10),
  published: z.boolean(),
});

export const articleInputSchema = articleFields.extend({
  tags: articleFields.shape.tags.default([]),
  published: articleFields.shape.published.default(false),
});
export type ArticleInput = z.infer<typeof articleInputSchema>;

/** For edits: no defaults, so a field left out stays as it is. */
export const articlePatchSchema = articleFields.partial().strict();

const optionalPhone = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;
    const e164 = normalizeSaudiPhone(value);
    if (!e164) {
      ctx.addIssue({ code: 'custom', message: 'invalid_phone' });
      return z.NEVER;
    }
    return e164;
  });
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

/** Firm details shown on the public site. Empty means "not provided" and the UI hides it. */
export const settingsSchema = z.object({
  phone: optionalPhone,
  whatsapp: optionalPhone,
  email: z.union([z.literal(''), z.email().max(200)]).transform((v) => v || null),
  address_ar: optionalText(300),
  address_en: optionalText(300),
  hours_ar: optionalText(200),
  hours_en: optionalText(200),
});
export type Settings = z.infer<typeof settingsSchema>;
export const settingKeys = Object.keys(settingsSchema.shape) as (keyof Settings)[];
