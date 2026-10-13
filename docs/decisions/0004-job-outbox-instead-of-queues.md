# 0004: D1 job outbox and a cron trigger instead of Cloudflare Queues

- Status: accepted
- Date: 2026-10-13

## Context

AGENTS.md section 6 says everything after saving a lead (staff notification, client auto-reply,
GA4 server event, and later the Google Ads offline conversion) must happen outside the request and
retry 5 times with exponential backoff. Section 2 names Cloudflare Queues for this.

The template has to deploy on a fresh free Cloudflare account with only the Workers and D1
permissions the deploy token already has. Queues needs its own token permission and a queue created
in each account, and the OpenNext Worker needs a custom entry to consume it.

## Decision

- Jobs are rows in a D1 `jobs` table (type, lead id, payload, status, attempts, `run_after`,
  last error, and a unique dedupe key).
- Right after the response, the request runs its own jobs with `waitUntil`, so a notification
  normally goes out within seconds.
- A cron trigger every 10 minutes runs anything due. Backoff after each failed attempt is 1 min,
  5 min, 30 min, 2 h; the 5th failure marks the job `failed` and logs `job_failed` (Workers
  observability; Sentry alerting plugs in at the same place).
- A job is claimed by bumping `attempts` only if it is unchanged, so the request and the cron never
  both send it. The claim also pushes `run_after` out, so a crash mid-send is retried.
- Every integration is optional. A job with missing settings is marked `skipped`, not failed.
- `worker.ts` wraps the OpenNext Worker to add the `scheduled` handler.

## Consequences

- No extra Cloudflare product, permission or setup; the outbox is visible in D1 and on the lead's
  page in `/admin`.
- Retries are as fine as the cron interval (10 minutes), which is enough for these jobs.
- Moving to Queues later means replacing `enqueue`/`runJobs` in `src/server/jobs/outbox.ts`; the
  handlers stay the same.
