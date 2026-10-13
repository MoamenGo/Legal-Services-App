import { readFileSync } from 'node:fs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
import { parseRedirectMap } from './src/lib/redirect-map';
import { securityHeaders } from './src/lib/security-headers';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Arabic is the default locale; there is no middleware, so the bare root redirects here.
      { source: '/', destination: '/ar', permanent: false },
      // Old-site URLs (AGENTS.md rule 7); the CSV is the source of truth.
      ...parseRedirectMap(
        readFileSync(new URL('../../docs/redirect-map.csv', import.meta.url), 'utf8'),
      ),
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({ dev: process.env.NODE_ENV === 'development' }),
      },
    ];
  },
};

export default withNextIntl(nextConfig);

// Gives `next dev` access to the D1/R2 bindings declared in wrangler.jsonc.
initOpenNextCloudflareForDev();
