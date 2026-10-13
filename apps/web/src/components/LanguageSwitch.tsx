'use client';

import { usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/routing';

/**
 * Links to the same page in the other locale by swapping the first path segment. A plain link, not
 * next/link: the other locale is a different document (lang, dir, messages), so a full load is
 * right, and it skips a prefetch of the other locale on every page view.
 */
export function LanguageSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const other: Locale = locale === 'ar' ? 'en' : 'ar';
  const rest = pathname.split('/').slice(2).join('/');
  return (
    <a
      href={`/${other}${rest ? `/${rest}` : ''}`}
      hrefLang={other}
      lang={other}
      className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
    >
      {label}
    </a>
  );
}
