import type { JobsEnv } from './env';
import { runJobs } from './outbox';

/** Cron entry point. Retries due jobs; later phases add daily housekeeping on its own schedule. */
export async function runScheduled(_cron: string, env: CloudflareEnv) {
  const results = await runJobs(env as unknown as JobsEnv);
  if (results.length > 0) console.info('jobs_run', { count: results.length });
}
