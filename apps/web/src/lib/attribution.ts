import type { LeadInputRaw } from '@app/schemas';

type LeadSource = NonNullable<LeadInputRaw['source']>;

const paramKeys = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gbraid',
  'wbraid',
] as const;

/**
 * Reads ad attribution from the current URL. Phase 4 replaces this with a 90-day first-party
 * cookie (first and last touch) so a visitor who browses before submitting keeps their gclid.
 */
export function collectSource(): LeadSource {
  const params = new URLSearchParams(window.location.search);
  const source: LeadSource = {
    landingPage: window.location.pathname.slice(0, 500),
    referrer: document.referrer.slice(0, 500) || undefined,
    device: window.matchMedia('(max-width: 767px)').matches
      ? 'mobile'
      : window.matchMedia('(max-width: 1023px)').matches
        ? 'tablet'
        : 'desktop',
  };
  for (const key of paramKeys) {
    const value = params.get(key);
    if (value) source[key] = value.slice(0, 200);
  }
  return source;
}
