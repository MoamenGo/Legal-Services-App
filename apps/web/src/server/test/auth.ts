import { signAccessToken } from '@/server/api/modules/auth/service';
import type { UserRole } from '@/server/db/schema';
import { testEnv } from './d1';

/** Authorization header for a user, signed with the same secret `testEnv` provides. */
export async function bearer(id: string, role: UserRole) {
  const secret = (testEnv({} as D1Database) as unknown as { JWT_ACCESS_SECRET: string })
    .JWT_ACCESS_SECRET;
  return {
    authorization: `Bearer ${await signAccessToken({ id, role, name: `Test ${role}` }, secret)}`,
  };
}
