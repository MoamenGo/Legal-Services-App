export const CONSENT_COOKIE = 'lsa_consent';
export type ConsentChoice = 'granted' | 'denied';
const MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
export const CONSENT_OPEN_EVENT = 'lsa:open-consent';

/**
 * Runs inline in <head> before GTM: Consent Mode v2 defaults to denied (AGENTS.md section 8), or to
 * the visitor's saved choice. Static text, so a CSP hash can allow it.
 */
export const consentDefaultScript = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}var m=document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=(granted|denied)/),g=m&&m[1]==='granted'?'granted':'denied';gtag('consent','default',{ad_storage:g,ad_user_data:g,ad_personalization:g,analytics_storage:g,functionality_storage:'granted',security_storage:'granted',wait_for_update:500});gtag('set','ads_data_redaction',true);gtag('set','url_passthrough',true);`;

export function readConsent(): ConsentChoice | null {
  const match = new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)`).exec(document.cookie);
  return (match?.[1] as ConsentChoice | undefined) ?? null;
}

type Gtag = (...args: unknown[]) => void;

export function saveConsent(choice: ConsentChoice) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${choice}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  gtag?.('consent', 'update', {
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
    analytics_storage: choice,
  });
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: 'consent_update', consent: choice });
}
