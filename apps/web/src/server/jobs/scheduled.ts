import type { JobsEnv } from './env';
import { runJobs } from './outbox';
import { anonymizeOldLeads, deleteStaleSessions, retentionMonths } from './retention';

/** Must match the daily entry in wrangler.jsonc `triggers.crons` (03:00 Riyadh). */
export const DAILY_CRON = '0 0 * * *';

type ScheduledEnv = JobsEnv & { LEAD_RETENTION_MONTHS?: string };

/** Cron entry point: retries due jobs every 10 minutes, and runs housekeeping once a day. */
export async function runScheduled(cron: string, env: CloudflareEnv) {
  const vars = env as unknown as ScheduledEnv;
  if (cron === DAILY_CRON) {
    const anonymized = await anonymizeOldLeads(
      vars.DB,
      retentionMonths(vars.LEAD_RETENTION_MONTHS),
    );
    await deleteStaleSessions(vars.DB);
    console.info('retention_run', { anonymized });
    return;
  }
  const results = await runJobs(vars);
  if (results.length > 0) console.info('jobs_run', { count: results.length });
}
