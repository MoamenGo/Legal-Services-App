'use client';

import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/routing';

/** Links to the same page in the other locale by swapping the first path segment. */
export function LanguageSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const other: Locale = locale === 'ar' ? 'en' : 'ar';
  const rest = pathname.split('/').slice(2).join('/');
  return (
    <NextLink
      href={`/${other}${rest ? `/${rest}` : ''}`}
      hrefLang={other}
      lang={other}
      className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
    >
      {label}
    </NextLink>
  );
}
