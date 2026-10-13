const ALGORITHM = 'pbkdf2-sha256';
/**
 * 100,000 is the most PBKDF2 iterations Workers' Web Crypto accepts. A login runs it once, which
 * the free plan's occasional-overrun allowance covers (ADR 0003). The count is stored per hash so
 * it can change without invalidating existing passwords.
 */
export const PBKDF2_ITERATIONS = 100_000;

const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (value: string) => {
  const binary = atob(value);
  // Backed by a plain ArrayBuffer so Web Crypto's BufferSource type accepts it.
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string, iterations = PBKDF2_ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, iterations);
  return `${ALGORITHM}$${iterations}$${b64(salt)}$${b64(hash)}`;
}

/** Constant-time comparison so timing does not reveal how many bytes matched. */
function equal(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, iterations, salt, hash] = stored.split('$');
  if (algorithm !== ALGORITHM || !iterations || !salt || !hash) return false;
  const actual = await derive(password, fromB64(salt), Number(iterations));
  return equal(actual, fromB64(hash));
}
