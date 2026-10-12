import { defineRouting } from 'next-intl/routing';
import { locales } from '@app/schemas';

export const routing = defineRouting({
  locales,
  defaultLocale: 'ar',
});

export type Locale = (typeof routing.locales)[number];

export const directionOf = (locale: Locale) => (locale === 'ar' ? 'rtl' : 'ltr');
