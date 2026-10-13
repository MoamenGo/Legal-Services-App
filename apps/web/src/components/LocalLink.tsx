import NextLink from 'next/link';
import { getLocale } from 'next-intl/server';
import type { ComponentProps } from 'react';

/**
 * Server-side link that prefixes the current locale. Unlike next-intl's `Link` it is not a client
 * component, so pages ship no i18n runtime to the browser.
 */
export async function Link({
  href,
  ...props
}: Omit<ComponentProps<typeof NextLink>, 'href'> & { href: string }) {
  const locale = await getLocale();
  return <NextLink href={`/${locale}${href === '/' ? '' : href}`} {...props} />;
}
