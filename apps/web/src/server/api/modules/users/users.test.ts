import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer } from '@/server/test/auth';
import { createTestDb, insertUser, testEnv } from '@/server/test/d1';
import { api } from '../../app';

let ctx: Awaited<ReturnType<typeof createTestDb>>;
let admin: string;
let intake: string;

beforeAll(async () => {
  ctx = await createTestDb();
  admin = await insertUser(ctx.db, { role: 'admin', email: 'admin@example.test' });
  intake = await insertUser(ctx.db, { role: 'intake', email: 'intake@example.test' });
});
afterAll(() => ctx.dispose());

const call = async (method: string, path: string, as: 'admin' | 'intake', body?: unknown) =>
  api.request(
    path,
    {
      method,
      headers: {
        'content-type': 'application/json',
        ...(await bearer(as === 'admin' ? admin : intake, as)),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    testEnv(ctx.db),
  );

describe('admin users', () => {
  it('lets an admin create a user that can then log in, without returning the hash', async () => {
    const res = await call('POST', '/api/admin/users', 'admin', {
      name: 'نورة المحامية',
      email: 'Noura@example.test',
      role: 'lawyer',
      password: 'a long enough password',
    });
    expect(res.status).toBe(201);
    const { user } = (await res.json()) as { user: Record<string, unknown> };
    expect(user.email).toBe('noura@example.test');
    expect(user).not.toHaveProperty('passwordHash');

    const login = await api.request(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'noura@example.test', password: 'a long enough password' }),
      },
      testEnv(ctx.db),
    );
    expect(login.status).toBe(200);
  });

  it('rejects duplicates, short passwords and non-admins', async () => {
    const body = {
      name: 'Dup',
      email: 'admin@example.test',
      role: 'intake',
      password: 'a long enough password',
    };
    expect((await call('POST', '/api/admin/users', 'admin', body)).status).toBe(409);
    expect(
      (
        await call('POST', '/api/admin/users', 'admin', {
          ...body,
          email: 'x@example.test',
          password: 'short',
        })
      ).status,
    ).toBe(400);
    expect(
      (await call('POST', '/api/admin/users', 'intake', { ...body, email: 'y@example.test' }))
        .status,
    ).toBe(403);
    expect((await call('GET', '/api/admin/users', 'intake')).status).toBe(403);
  });

  it('gives intake the assignable list only', async () => {
    const res = await call('GET', '/api/admin/users/assignable', 'intake');
    expect(res.status).toBe(200);
    const { users } = (await res.json()) as { users: Record<string, unknown>[] };
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).not.toHaveProperty('email');
  });

  it('stops an admin deactivating themselves, and masks password changes in the audit log', async () => {
    expect(
      (await call('PATCH', `/api/admin/users/${admin}`, 'admin', { active: false })).status,
    ).toBe(400);
    expect(
      (
        await call('PATCH', `/api/admin/users/${intake}`, 'admin', {
          password: 'another long password',
        })
      ).status,
    ).toBe(200);
    const row = await ctx.db
      .prepare("select diff from audit_log where action = 'user.update' and entity_id = ?")
      .bind(intake)
      .first<{ diff: string }>();
    expect(row!.diff).not.toContain('another long password');
    expect(JSON.parse(row!.diff)).toEqual({ password: ['***', '***'] });
  });
});
