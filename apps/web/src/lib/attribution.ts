import type { LeadInputRaw } from '@app/schemas';

type LeadSource = NonNullable<LeadInputRaw['source']>;

export const ATTRIBUTION_COOKIE = 'lsa_attr';
const MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

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
type ParamKey = (typeof paramKeys)[number];

export type Touch = Partial<Record<ParamKey, string>> & {
  landingPage: string;
  referrer?: string;
  /** Unix seconds. */
  at: number;
};
export type Attribution = { first: Touch; last: Touch };

const clip = (value: string, max: number) => value.slice(0, max);

/** The visit's touch: tracking params, landing path and an external referrer. */
export function touchFrom(url: URL, referrer: string, now = Date.now()): Touch {
  const touch: Touch = { landingPage: clip(url.pathname, 300), at: Math.floor(now / 1000) };
  for (const key of paramKeys) {
    const value = url.searchParams.get(key);
    if (value) touch[key] = clip(value, 150);
  }
  if (referrer) {
    try {
      // Internal navigation is not a source.
      if (new URL(referrer).host !== url.host) touch.referrer = clip(referrer, 300);
    } catch {
      // Not a URL; ignore it.
    }
  }
  return touch;
}

const isCampaign = (touch: Touch) => paramKeys.some((key) => touch[key]);

/**
 * First touch is kept for 90 days. Last touch moves only on a new campaign click, so browsing the
 * site afterwards (or coming back directly) does not wipe the gclid Google Ads needs.
 */
export function mergeTouch(existing: Attribution | null, touch: Touch): Attribution {
  if (!existing) return { first: touch, last: touch };
  return isCampaign(touch) ? { first: existing.first, last: touch } : existing;
}

export function parseAttribution(cookieHeader: string): Attribution | null {
  const raw = cookieHeader
    .split(/;\s*/)
    .find((part) => part.startsWith(`${ATTRIBUTION_COOKIE}=`))
    ?.slice(ATTRIBUTION_COOKIE.length + 1);
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw)) as Attribution;
    return value?.first?.landingPage && value.last?.landingPage ? value : null;
  } catch {
    return null;
  }
}

export function attributionCookie(value: Attribution, secure: boolean) {
  return `${ATTRIBUTION_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
}

/** Runs on every page load. */
export function captureAttribution() {
  const url = new URL(window.location.href);
  const existing = parseAttribution(document.cookie);
  const next = mergeTouch(existing, touchFrom(url, document.referrer));
  if (next !== existing) document.cookie = attributionCookie(next, url.protocol === 'https:');
}

const device = (): LeadSource['device'] =>
  window.matchMedia('(max-width: 767px)').matches
    ? 'mobile'
    : window.matchMedia('(max-width: 1023px)').matches
      ? 'tablet'
      : 'desktop';

/** Lead source sent with the form: the last campaign touch, plus the first touch for reporting. */
export function sourceFor(attribution: Attribution | null, fallback: Touch): LeadSource {
  const last = attribution?.last ?? fallback;
  const source: LeadSource = { landingPage: last.landingPage, referrer: last.referrer };
  for (const key of paramKeys) if (last[key]) source[key] = last[key];
  const first = attribution?.first;
  if (first && first !== last && first.at !== last.at) {
    source.first_utm_source = first.utm_source;
    source.first_utm_campaign = first.utm_campaign;
    source.first_landingPage = first.landingPage;
    source.first_referrer = first.referrer;
  }
  return source;
}

export function collectSource(): LeadSource {
  const url = new URL(window.location.href);
  return {
    ...sourceFor(parseAttribution(document.cookie), touchFrom(url, document.referrer)),
    device: device(),
  };
}
