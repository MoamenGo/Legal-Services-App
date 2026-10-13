# 0006: Lead retention, deletion requests and security headers

- Status: accepted
- Date: 2026-10-13

## Context

AGENTS.md section 9 asks for a scheduled job that anonymizes leads older than
`LEAD_RETENTION_MONTHS`, a way to honour PDPL deletion requests, and a strict CSP. Pages are
prerendered and served from static assets (ADR 0005).

## Decision

- **New field `leads.anonymized_at`** (migration `0004_lead_retention.sql`). Anonymizing clears
  name, phone, email, message, lead notes and job payloads, and drops click ids, referrers and query
  strings from `source`. Status, case type, value, dates and campaign fields stay, so funnel reports
  keep their history. Rows are kept rather than deleted for the same reason.
- **Daily cron** `0 0 * * *` (03:00 Riyadh) runs the retention job and deletes expired refresh
  sessions. The 10-minute cron still retries jobs. Default period: 24 months (`wrangler.jsonc`).
- **Deletion request:** `POST /api/admin/leads/:id/anonymize`, admin only, audited, with a button on
  the lead page. It applies the same treatment immediately and cannot be undone.
- **CSP** allows `'self'`, Google Tag Manager, GA4, Google Ads and Turnstile hosts explicitly.
  `script-src` includes `'unsafe-inline'`: Next.js inlines its page data as scripts, nonces would
  force every page to render per request (losing the static serving that keeps us inside the free
  plan's CPU limit), and hashes change with every content edit. The host allow-list,
  `object-src 'none'`, `base-uri 'self'` and `frame-ancestors 'none'` still apply.
- **Old-site redirects** come from `docs/redirect-map.csv` at build time; a malformed row fails the
  build.

## Consequences

- Restoring a D1 backup taken before an anonymization brings the PII back; backups follow the same
  retention (docs/runbooks/backup-restore.md).
- Moving to nonce-based CSP later means rendering pages per request, which needs the Workers paid
  plan.
