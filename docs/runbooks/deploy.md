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
4. Create the database and put its id in `apps/web/wrangler.jsonc` (`database_id`). For this
   repo it is already set; a new copy of the template needs its own:

   ```sh
   cd apps/web
   npx wrangler login
   npx wrangler d1 create legal-services-db
   ```

5. Set runtime secrets as they are introduced, e.g. `npx wrangler secret put TURNSTILE_SECRET_KEY`.
6. Merge to `main`. The site is served at `https://legal-services-app.<your-subdomain>.workers.dev`.

## Turnstile (spam protection on the lead form)

The template ships with Cloudflare's public Turnstile **test** keys so the form works out of the box.
Test keys accept every visitor, so switch to real keys before sending ad traffic (ADR 0002):

1. Cloudflare dashboard → Turnstile → Add widget. Hostname: the site's domain (and the
   `*.workers.dev` one while it is used). Mode: Managed.
2. GitHub → Settings → Secrets and variables → Actions → **Variables** → add
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` with the site key (it is public, so a variable, not a secret).
3. `cd apps/web && npx wrangler secret put TURNSTILE_SECRET_KEY` and paste the secret key.
4. Re-run the Deploy workflow (or merge any change) so the pages rebuild with the new site key.

Once a real site key is set, the API refuses leads (503 `captcha_not_configured`) until the secret
is set too, so do step 3 before step 4.

## Manual deploy

```sh
cd apps/web
pnpm db:migrate:remote
pnpm run deploy
```

## Rollback

`npx wrangler rollback` returns to the previous Worker version. Migrations are additive so an older
Worker keeps working against the newer schema.

## Admin dashboard access

The dashboard is at `/admin`. The deploy workflow creates the `JWT_ACCESS_SECRET` Worker secret on
its own the first time. To create the first admin account:

1. GitHub → Settings → Secrets and variables → Actions → **Secrets** → add `ADMIN_EMAIL` and
   `ADMIN_PASSWORD` (at least 12 characters). Optionally add `ADMIN_NAME`.
2. Re-run the Deploy workflow (Actions → Deploy → Run workflow) or merge any change.
3. Sign in at `/admin/login`, then add the rest of the team in **Users**.

The workflow only inserts the admin when no user has that email, so changing the secret later does
not change the password. Change passwords in **Users** instead. After the first sign-in the two
secrets can be deleted.

Locally: `cd apps/web && pnpm db:migrate:local && pnpm seed`, then sign in as `admin@example.com`
with `local-dev-password` (or the `SEED_PASSWORD` you set). `.dev.vars` needs `JWT_ACCESS_SECRET`.

## Publishing content from /admin

Articles and firm details saved in `/admin` go live when the site is rebuilt (ADR 0005). Every
deploy exports them from D1, so they also appear with the next merge. To make **Publish changes**
work from the dashboard:

1. GitHub → Settings (your profile) → Developer settings → Fine-grained tokens → Generate new
   token. Repository access: only this repository. Permissions: **Actions: Read and write**.
   Expiry: the longest you are comfortable with (renew it before it expires).
2. `cd apps/web && npx wrangler secret put GITHUB_DEPLOY_TOKEN` and paste the token.
3. `GITHUB_REPOSITORY` in `apps/web/wrangler.jsonc` must be `owner/name` of this repository.

Optional, for other tools: `npx wrangler secret put REVALIDATE_SECRET`, then
`curl -X POST -H "x-revalidate-secret: <secret>" https://<site>/api/webhooks/revalidate`.

Locally: `cd apps/web && pnpm content:export --local && pnpm preview` shows content saved in a local
`/admin`.
