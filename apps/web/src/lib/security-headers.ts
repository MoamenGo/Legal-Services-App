/**
 * Response headers for every route (AGENTS.md section 9). Kept out of next.config so they can be
 * unit-tested and documented in one place.
 *
 * Why `'unsafe-inline'` in script-src: pages are prerendered (SSG) and Next.js inlines its React
 * payload as scripts, so per-request nonces would force every page to render on each request, and
 * hashes change with every content edit. The allow-list of script hosts is what limits third
 * parties; GTM is the only tag loaded directly (section 8).
 */
const google = {
  scripts: [
    'https://*.googletagmanager.com',
    'https://www.googleadservices.com',
    'https://googleads.g.doubleclick.net',
    'https://www.google.com',
  ],
  beacons: [
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
    'https://*.g.doubleclick.net',
    'https://googleads.g.doubleclick.net',
    'https://www.google.com',
    'https://www.google.com.sa',
    'https://pagead2.googlesyndication.com',
  ],
  frames: ['https://www.googletagmanager.com', 'https://td.doubleclick.net'],
};
const turnstile = 'https://challenges.cloudflare.com';

export function contentSecurityPolicy({ dev = false } = {}) {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // Next.js dev mode evaluates modules for fast refresh; production never needs eval.
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      ...(dev ? ["'unsafe-eval'"] : []),
      ...google.scripts,
      turnstile,
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', ...google.beacons],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...google.beacons, turnstile],
    'frame-src': [...google.frames, turnstile],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    ...(dev ? {} : { 'upgrade-insecure-requests': [] }),
  };
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values].join(' '))
    .join('; ');
}

export function securityHeaders({ dev = false } = {}) {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy({ dev }) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    },
  ];
}
