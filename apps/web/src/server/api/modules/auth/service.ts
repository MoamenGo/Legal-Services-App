import { and, eq, gt, isNull } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { createDb } from '@/server/db/client';
import { sessions, users, type UserRole } from '@/server/db/schema';
import { verifyPassword } from '@/server/lib/password';
import { randomToken, sha256Hex } from '@/server/lib/tokens';
import { uuidv7 } from '@/server/lib/uuid';

export const ACCESS_TOKEN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_SECONDS = 14 * 24 * 60 * 60;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export type PublicUser = { id: string; name: string; email: string; role: UserRole };

export async function signAccessToken(
  user: { id: string; role: UserRole; name: string },
  secret: string,
) {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { sub: user.id, role: user.role, name: user.name, iat: now, exp: now + ACCESS_TOKEN_SECONDS },
    secret,
    'HS256',
  );
}

async function createSession(d1: D1Database, userId: string) {
  const token = randomToken();
  await createDb(d1)
    .insert(sessions)
    .values({
      id: uuidv7(),
      userId,
      tokenHash: await sha256Hex(token),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_SECONDS * 1000),
    });
  return token;
}

type LoginResult =
  | { ok: true; user: PublicUser; refreshToken: string }
  | { ok: false; reason: 'invalid' | 'locked' };

/** Checks credentials, applying the 5-failures / 15-minute lockout (AGENTS.md section 9). */
export async function login(d1: D1Database, email: string, password: string): Promise<LoginResult> {
  const db = createDb(d1);
  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
  if (!user || !user.active) {
    // Same work and answer as a wrong password, so the response does not reveal which emails exist.
    await verifyPassword(
      password,
      'pbkdf2-sha256$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    );
    return { ok: false, reason: 'invalid' };
  }
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now())
    return { ok: false, reason: 'locked' };

  if (!(await verifyPassword(password, user.passwordHash))) {
    const failed = user.failedLogins + 1;
    const lock = failed >= MAX_FAILED_LOGINS;
    await db
      .update(users)
      .set({
        failedLogins: lock ? 0 : failed,
        lockedUntil: lock ? new Date(Date.now() + LOCKOUT_MS) : null,
      })
      .where(eq(users.id, user.id));
    return { ok: false, reason: lock ? 'locked' : 'invalid' };
  }

  await db
    .update(users)
    .set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  return {
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    refreshToken: await createSession(d1, user.id),
  };
}

/** Rotates a refresh token: the old session is revoked and a new one issued. */
export async function refresh(d1: D1Database, token: string) {
  const db = createDb(d1);
  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.tokenHash, await sha256Hex(token)),
      isNull(sessions.revokedAt),
      gt(sessions.expiresAt, new Date()),
    ),
  });
  if (!session) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  if (!user || !user.active) return null;
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));
  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role } satisfies PublicUser,
    refreshToken: await createSession(d1, user.id),
  };
}

export async function logout(d1: D1Database, token: string) {
  await createDb(d1)
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, await sha256Hex(token)));
}
