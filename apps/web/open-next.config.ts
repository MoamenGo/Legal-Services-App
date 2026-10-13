import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

/**
 * Prerendered pages are served from Workers static assets instead of being rendered on every
 * request, which keeps public pages inside the free plan's CPU limit. Content changes go live by
 * rebuilding (ADR 0005), so no revalidation cache is needed.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  // Answers cached pages before the Next.js server loads.
  enableCacheInterception: true,
});
