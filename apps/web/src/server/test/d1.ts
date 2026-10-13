import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getPlatformProxy } from 'wrangler';
import { hashPassword } from '@/server/lib/password';
import { uuidv7 } from '@/server/lib/uuid';
import type { UserRole } from '@/server/db/schema';

const root = new URL('../../../', import.meta.url).pathname;

/**
 * A real local D1 (Miniflare) with every migration applied, isolated in a temp folder per test file.
 * Using the real database catches SQL and index mistakes that a mocked binding would hide.
 */
export async function createTestDb() {
  const dir = mkdtempSync(join(tmpdir(), 'd1-test-'));
  const proxy = await getPlatformProxy<CloudflareEnv>({
    configPath: join(root, 'wrangler.jsonc'),
    persist: { path: dir },
  });
  const db = proxy.env.DB;
  const migrations = readdirSync(join(root, 'migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const file of migrations) {
    const statements = readFileSync(join(root, 'migrations', file), 'utf8')
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);
    await db.batch(statements.map((s) => db.prepare(s)));
  }
  return {
    db,
    async dispose() {
      await proxy.dispose();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** Low iteration count keeps tests fast; the count is stored in the hash so verify still works. */
export async function insertUser(
  db: D1Database,
  {
    role,
    email,
    password = 'correct horse battery',
    active = true,
  }: { role: UserRole; email: string; password?: string; active?: boolean },
) {
  const id = uuidv7();
  await db
    .prepare(
      'insert into users (id, name, email, password_hash, role, active) values (?, ?, ?, ?, ?, ?)',
    )
    .bind(id, `Test ${role}`, email, await hashPassword(password, 1000), role, active ? 1 : 0)
    .run();
  return id;
}

export async function insertLead(
  db: D1Database,
  fields: {
    name?: string;
    phone?: string;
    status?: string;
    assignedTo?: string | null;
    campaign?: string;
    gclid?: string;
    createdAt?: Date;
  } = {},
) {
  const id = uuidv7();
  const created = Math.floor((fields.createdAt ?? new Date()).getTime() / 1000);
  await db
    .prepare(
      `insert into leads (id, name, phone, case_type, preferred_contact, language, source, status, assigned_to, privacy_accepted_at, created_at, updated_at)
       values (?, ?, ?, 'labor', 'call', 'ar', ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      fields.name ?? 'عميل تجريبي',
      fields.phone ?? '+966550000001',
      JSON.stringify({ utm_campaign: fields.campaign, gclid: fields.gclid }),
      fields.status ?? 'new',
      fields.assignedTo ?? null,
      created,
      created,
      created,
    )
    .run();
  return id;
}

export const testEnv = (db: D1Database, overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    DB: db,
    LEAD_RATE_LIMITER: { limit: async () => ({ success: true }) },
    AUTH_RATE_LIMITER: { limit: async () => ({ success: true }) },
    JWT_ACCESS_SECRET: 'test-secret-that-is-long-enough-1234567890',
    ...overrides,
  }) as unknown as CloudflareEnv;
