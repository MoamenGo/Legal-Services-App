# Deploy runbook

Production deploys run from GitHub Actions on every merge to `main` (`.github/workflows/deploy.yml`).
Until the two repo secrets below exist, the deploy job skips with a notice and CI still runs.

## One-time setup (done by a human)

1. Create a free Cloudflare account and copy the **Account ID** from the dashboard.
2. Create an API token (My Profile → API Tokens → Create Token) with:
   - Account · Workers Scripts · Edit
   - Account · D1 · Edit
   - Account · Workers R2 Storage · Edit (needed once media uploads land)
3. In GitHub → Settings → Secrets and variables → Actions, add `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID`.
4. Create the database and put its id in `apps/web/wrangler.jsonc` (`database_id`):

   ```sh
   cd apps/web
   npx wrangler login
   npx wrangler d1 create legal-services-db
   ```

5. Set runtime secrets as they are introduced, e.g. `npx wrangler secret put TURNSTILE_SECRET_KEY`.
6. Merge to `main`. The site is served at `https://legal-services-app.<your-subdomain>.workers.dev`.

## Manual deploy

```sh
cd apps/web
pnpm db:migrate:remote
pnpm run deploy
```

## Rollback

`npx wrangler rollback` returns to the previous Worker version. Migrations are additive so an older
Worker keeps working against the newer schema.
