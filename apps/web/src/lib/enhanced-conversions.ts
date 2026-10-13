import { normalizeSaudiPhone } from '@app/schemas/phone';

const KEY = 'lsa_ec';

export type UserData = { sha256_email_address?: string; sha256_phone_number?: string };

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Google's Enhanced Conversions normalization: trimmed lowercase email, E.164 phone, then SHA-256. */
export async function hashUserData(email: string | undefined, phone: string): Promise<UserData> {
  const data: UserData = {};
  const cleanEmail = email?.trim().toLowerCase();
  if (cleanEmail) data.sha256_email_address = await sha256(cleanEmail);
  const e164 = normalizeSaudiPhone(phone);
  if (e164) data.sha256_phone_number = await sha256(e164);
  return data;
}

/** Kept for the thank-you page only; only hashes are ever stored (AGENTS.md section 8). */
export async function rememberUserData(email: string | undefined, phone: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(await hashUserData(email, phone)));
  } catch {
    // Storage blocked: the conversion is still counted, just without enhanced matching.
  }
}

/** Reads and forgets the hashes, so they are used at most once. */
export function takeUserData(): UserData | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return raw ? (JSON.parse(raw) as UserData) : null;
  } catch {
    return null;
  }
}
