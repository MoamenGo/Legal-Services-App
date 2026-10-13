import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, securityHeaders } from './security-headers';

describe('securityHeaders', () => {
  it('allows GTM, Google Ads and Turnstile, and blocks framing, plugins and eval', () => {
    const csp = contentSecurityPolicy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toMatch(/script-src [^;]*https:\/\/\*\.googletagmanager\.com/);
    expect(csp).toMatch(/script-src [^;]*https:\/\/challenges\.cloudflare\.com/);
    expect(csp).toMatch(/connect-src [^;]*https:\/\/\*\.google-analytics\.com/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain('unsafe-eval');
    expect(contentSecurityPolicy({ dev: true })).toContain("'unsafe-eval'");
  });

  it('sends HSTS, nosniff and the referrer policy', () => {
    const headers = Object.fromEntries(securityHeaders().map((h) => [h.key, h.value]));
    expect(headers['Strict-Transport-Security']).toContain('max-age=63072000');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });
});
