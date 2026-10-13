import type { UserRole } from '@/server/db/schema';
import type { JobsEnv } from '@/server/jobs/env';

export type AuthUser = { id: string; role: UserRole; name: string };

export type ApiEnv = {
  Bindings: Pick<CloudflareEnv, 'DB' | 'LEAD_RATE_LIMITER' | 'AUTH_RATE_LIMITER'> &
    Omit<JobsEnv, 'DB'> & {
      /** Secret set with `wrangler secret put`; absent while the template uses Turnstile test keys. */
      TURNSTILE_SECRET_KEY?: string;
      /** Signs 15-minute admin access tokens. The deploy workflow creates it if missing. */
      JWT_ACCESS_SECRET?: string;
    };
  Variables: { user: AuthUser };
};

/**
 * Runs work after the response is sent. Without an execution context (unit tests) the work is left
 * for the cron run, which picks up every pending job anyway.
 */
export function inBackground(
  c: { executionCtx: { waitUntil(promise: Promise<unknown>): void } },
  work: () => Promise<unknown>,
) {
  try {
    c.executionCtx.waitUntil(work());
  } catch {
    // No execution context.
  }
}
