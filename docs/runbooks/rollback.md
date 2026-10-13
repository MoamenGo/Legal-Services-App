# Rollback runbook

Use this when a deploy breaks the site. Every merge to `main` deploys, so the fastest fix is usually
to go back one Worker version, then fix forward with a normal PR.

## 1. Roll the Worker back (about a minute)

Cloudflare dashboard → Workers & Pages → `legal-services-app` → **Deployments** → pick the last good
version → **Rollback**. Or from a machine with Wrangler logged in:

```sh
cd apps/web
npx wrangler deployments list        # find the last good version id
npx wrangler rollback <version-id>
```

The rolled-back version keeps serving until the next deploy. Pages and content come back exactly as
they were at that version.

## 2. Database

Migrations only add tables and columns, so an older Worker keeps working against the newer
database. Do not undo a migration by hand. If data itself was damaged, follow
`backup-restore.md`.

## 3. Fix forward

1. Revert the bad merge on GitHub (the PR page has a **Revert** button), or open a fix PR.
2. Merge it once CI is green. The Deploy workflow builds and deploys the fixed version.

## 4. Content mistakes

A wrong article or phone number is not a code problem: correct it in `/admin` and press
**Publish changes**. To hide an article immediately, untick **Published** and publish.

## Secrets

If a secret leaked, rotate it first (`npx wrangler secret put <NAME>`), then roll back if needed.
Rotating `JWT_ACCESS_SECRET` signs everyone out within 15 minutes; deleting all rows in `sessions`
signs everyone out at once.
