import type { UserRole } from '@/server/db/schema';

export type AuthUser = { id: string; role: UserRole; name: string };

export type ApiEnv = {
  Bindings: Pick<CloudflareEnv, 'DB' | 'LEAD_RATE_LIMITER' | 'AUTH_RATE_LIMITER'> & {
    /** Secret set with `wrangler secret put`; absent while the template uses Turnstile test keys. */
    TURNSTILE_SECRET_KEY?: string;
    /** Signs 15-minute admin access tokens. The deploy workflow creates it if missing. */
    JWT_ACCESS_SECRET?: string;
  };
  Variables: { user: AuthUser };
};
