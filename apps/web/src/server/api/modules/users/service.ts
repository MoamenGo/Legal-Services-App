import { asc, eq } from 'drizzle-orm';
import { createDb } from '@/server/db/client';
import { users, type UserRole } from '@/server/db/schema';
import { hashPassword } from '@/server/lib/password';
import { uuidv7 } from '@/server/lib/uuid';

const publicColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  active: users.active,
  lastLoginAt: users.lastLoginAt,
  createdAt: users.createdAt,
};

export const listUsers = (d1: D1Database) =>
  createDb(d1).select(publicColumns).from(users).orderBy(asc(users.name));

export const findUser = async (d1: D1Database, id: string) =>
  (await createDb(d1).select(publicColumns).from(users).where(eq(users.id, id)).limit(1))[0];

export async function createUser(
  d1: D1Database,
  input: { name: string; email: string; role: UserRole; password: string },
) {
  const id = uuidv7();
  await createDb(d1)
    .insert(users)
    .values({
      id,
      name: input.name,
      email: input.email.toLowerCase(),
      role: input.role,
      passwordHash: await hashPassword(input.password),
      createdAt: new Date(),
    });
  return id;
}

export async function updateUser(
  d1: D1Database,
  id: string,
  patch: { name?: string; role?: UserRole; active?: boolean; password?: string },
) {
  const { password, ...rest } = patch;
  await createDb(d1)
    .update(users)
    .set({
      ...rest,
      ...(password
        ? { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null }
        : {}),
    })
    .where(eq(users.id, id));
}
