import { and, eq, inArray, lte } from 'drizzle-orm';
import { createDb } from '@/server/db/client';
import { jobs, type JobType } from '@/server/db/schema';
import { uuidv7 } from '@/server/lib/uuid';
import type { JobsEnv } from './env';
import { handlers, type JobRow } from './handlers';

export const MAX_ATTEMPTS = 5;
/** Wait before attempt n+1 after attempt n fails: 1 min, 5 min, 30 min, 2 h (AGENTS.md section 6). */
const BACKOFF_SECONDS = [60, 300, 1800, 7200];
const BATCH = 25;

export type NewJob = {
  type: JobType;
  leadId?: string;
  payload?: Record<string, unknown>;
  dedupeKey?: string;
};

/** Queues jobs; one whose dedupe key already exists is ignored. Returns the ids that were queued. */
export async function enqueue(d1: D1Database, items: NewJob[]) {
  if (items.length === 0) return [];
  const now = new Date();
  const rows = items.map((item) => ({
    id: uuidv7(),
    type: item.type,
    leadId: item.leadId ?? null,
    payload: item.payload ?? {},
    dedupeKey: item.dedupeKey ?? null,
    runAfter: now,
    createdAt: now,
    updatedAt: now,
  }));
  const inserted = await createDb(d1)
    .insert(jobs)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: jobs.id });
  return inserted.map((r) => r.id);
}

/**
 * Runs due jobs: the given ids right after a request, or everything due when the cron fires. A job
 * is claimed by bumping `attempts` only if nobody else did, so the request and the cron never send
 * the same message twice. The claim also pushes `run_after` out, so a crash mid-run is retried later.
 */
export async function runJobs(env: JobsEnv, { ids }: { ids?: string[] } = {}) {
  const db = createDb(env.DB);
  const now = new Date();
  const due = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.status, 'pending'), ids ? inArray(jobs.id, ids) : lte(jobs.runAfter, now)))
    .limit(BATCH);

  const results: { id: string; status: string }[] = [];
  for (const job of due) {
    const attempt = job.attempts + 1;
    const retryAt = new Date(Date.now() + (BACKOFF_SECONDS[attempt - 1] ?? 7200) * 1000);
    const claimed = await db
      .update(jobs)
      .set({ attempts: attempt, runAfter: retryAt, updatedAt: new Date() })
      .where(and(eq(jobs.id, job.id), eq(jobs.status, 'pending'), eq(jobs.attempts, job.attempts)))
      .returning({ id: jobs.id });
    if (claimed.length === 0) continue;

    const status = await runOne(env, job as JobRow, attempt);
    results.push({ id: job.id, status });
  }
  return results;
}

async function runOne(env: JobsEnv, job: JobRow, attempt: number) {
  const db = createDb(env.DB);
  try {
    const outcome = await handlers[job.type](env, job);
    const status = outcome.outcome;
    await db
      .update(jobs)
      .set({
        status,
        lastError: 'reason' in outcome ? outcome.reason : null,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, job.id));
    if (status === 'failed')
      console.error('job_failed', { id: job.id, type: job.type, reason: outcome.reason });
    return status;
  } catch (error) {
    // Error text comes from our own handlers and provider status lines, never lead data.
    const message = (error instanceof Error ? error.message : 'unknown error').slice(0, 500);
    const final = attempt >= MAX_ATTEMPTS;
    await db
      .update(jobs)
      .set({ status: final ? 'failed' : 'pending', lastError: message, updatedAt: new Date() })
      .where(eq(jobs.id, job.id));
    // Workers observability keeps these logs; Sentry alerting hooks in here once configured.
    if (final)
      console.error('job_failed', {
        id: job.id,
        type: job.type,
        attempts: attempt,
        error: message,
      });
    return final ? 'failed' : 'retry';
  }
}
