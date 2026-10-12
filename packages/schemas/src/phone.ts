const ARABIC_INDIC_DIGITS = /[٠-٩۰-۹]/g;

/** Converts Arabic-Indic and Persian digits to ASCII so "٠٥٥..." validates like "055...". */
function toAsciiDigits(value: string): string {
  return value.replace(ARABIC_INDIC_DIGITS, (d) => String((d.charCodeAt(0) & 0xf) % 10));
}

/**
 * Normalizes a Saudi mobile number to E.164 (+9665XXXXXXXX).
 * Accepts 05XXXXXXXX, 5XXXXXXXX, 9665XXXXXXXX, 009665XXXXXXXX and +9665XXXXXXXX,
 * with spaces or dashes. Returns null when the input is not a Saudi mobile number.
 */
export function normalizeSaudiPhone(input: string): string | null {
  const digits = toAsciiDigits(input).replace(/[\s\-().]/g, '');
  const match = /^(?:\+966|00966|966|0)?(5\d{8})$/.exec(digits);
  return match ? `+966${match[1]}` : null;
}

/** Masks a phone for logs: +9665****123. Never log the full number. */
export function maskPhone(e164: string): string {
  return e164.length > 8 ? `${e164.slice(0, 5)}****${e164.slice(-3)}` : '****';
}
