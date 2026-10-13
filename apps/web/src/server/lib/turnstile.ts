import { TURNSTILE_TEST_SITE_KEY } from '@/content/site';

/** Turnstile's public test secret, paired with the test site key; it accepts any token. */
export const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';

/**
 * The secret to verify tokens with. While the site still runs on the public test site key (the
 * template demo), the matching test secret is used; a real site key always needs a real secret.
 */
export function turnstileSecret(env: { TURNSTILE_SECRET_KEY?: string }, siteKey: string) {
  if (env.TURNSTILE_SECRET_KEY) return env.TURNSTILE_SECRET_KEY;
  return siteKey === TURNSTILE_TEST_SITE_KEY ? TURNSTILE_TEST_SECRET : undefined;
}

export async function verifyTurnstile(
  token: string,
  secret: string,
  ip?: string,
): Promise<boolean> {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Verifier unreachable: treat as unverified so the visitor gets a retryable error, not a 500.
    return false;
  }
}
