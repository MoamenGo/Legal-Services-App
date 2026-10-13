import { describe, expect, it } from 'vitest';
import { articleInputSchema, settingsSchema, slugSchema } from './content';

describe('content schemas', () => {
  it('accepts clean slugs only', () => {
    expect(slugSchema.safeParse('labor-law-basics').success).toBe(true);
    for (const bad of ['Labor', 'a--b', '-a', 'قانون-العمل', 'a b', '../x']) {
      expect(slugSchema.safeParse(bad).success).toBe(false);
    }
  });

  it('requires Arabic and makes English optional', () => {
    const base = {
      slug: 'labor-law',
      title: { ar: 'نظام العمل' },
      summary: { ar: 'ملخص' },
      body: { ar: 'نص' },
    };
    const parsed = articleInputSchema.parse({ ...base, title: { ar: 'نظام العمل', en: '' } });
    expect(parsed.title.en).toBeUndefined();
    expect(parsed.published).toBe(false);
    expect(articleInputSchema.safeParse({ ...base, title: { ar: '' } }).success).toBe(false);
  });

  it('normalizes phones and treats empty fields as not provided', () => {
    const parsed = settingsSchema.parse({
      phone: '0551234567',
      whatsapp: '',
      email: '',
      address_ar: ' الرياض ',
      address_en: '',
      hours_ar: '',
      hours_en: '',
    });
    expect(parsed).toMatchObject({
      phone: '+966551234567',
      whatsapp: null,
      email: null,
      address_ar: 'الرياض',
    });
    expect(settingsSchema.safeParse({ ...parsed, phone: '12345' }).success).toBe(false);
  });
});
