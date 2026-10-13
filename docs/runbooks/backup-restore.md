# Backup and restore runbook

The site's code is in Git and its pages are rebuilt on every deploy. The only data that needs
backing up is the D1 database (`legal-services-db`): leads, users, articles, settings and the
audit log.

## Automatic: D1 Time Travel

D1 keeps a point-in-time history of the database without any setup: 7 days on the free plan, 30
days on the paid plan. It is the first thing to use after a bad change or a mistaken bulk edit.

```sh
cd apps/web
npx wrangler d1 time-travel info legal-services-db                      # current bookmark
npx wrangler d1 time-travel restore legal-services-db --timestamp=2026-10-13T08:00:00Z
```

Restore replaces the whole database with its state at that moment; leads received after it are
lost, so export them first (below) and re-enter them if needed.

## Manual: monthly export

Time Travel does not cover mistakes noticed after 7 days, so an admin exports once a month:

```sh
cd apps/web
npx wrangler d1 export legal-services-db --remote --output=backup-$(date +%F).sql
```

The file contains client PII. Store it encrypted in the firm's approved storage (not in Git, chat
or email), keep at most the last 12, and delete older ones, so backups respect the same retention
period as the live data (ADR 0006).

## Restore an export into a fresh database

```sh
npx wrangler d1 create legal-services-db-restore
npx wrangler d1 execute legal-services-db-restore --remote --file=backup-2026-10-01.sql
```

Check the data, then either point `database_id` in `wrangler.jsonc` at the new database and deploy,
or copy the rows you need across. Run `pnpm db:migrate:remote` afterwards so the schema is current.

## Test the restore

Every quarter, restore the latest export into a scratch database as above and check that the lead
count matches the dashboard. Delete the scratch database afterwards.
