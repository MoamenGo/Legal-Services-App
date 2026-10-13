import type { Context } from 'hono';
import { createDb } from '@/server/db/client';
import { auditLog } from '@/server/db/schema';
import { uuidv7 } from '@/server/lib/uuid';
import type { ApiEnv } from './env';

type Diff = Record<string, [unknown, unknown]>;

/** Records who did what (AGENTS.md section 5). Pass field names and non-PII values only. */
export async function audit(
  c: Context<ApiEnv>,
  action: string,
  entity: string,
  entityId: string | null,
  diff?: Diff,
) {
  await createDb(c.env.DB)
    .insert(auditLog)
    .values({
      id: uuidv7(),
      userId: c.get('user')?.id ?? null,
      action,
      entity,
      entityId,
      diff: diff ?? null,
      ip: c.req.header('cf-connecting-ip') ?? null,
      at: new Date(),
    });
}

/** Builds { field: [before, after] } for the fields that actually changed. */
export function diffOf<T extends Record<string, unknown>>(before: T, after: Partial<T>): Diff {
  const out: Diff = {};
  for (const [key, value] of Object.entries(after)) {
    if (value !== undefined && before[key] !== value) out[key] = [before[key], value];
  }
  return out;
}
