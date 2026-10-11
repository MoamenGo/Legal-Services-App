# Legal Services App

A bilingual (Arabic RTL first, English) website and lead-intake template for an independent lawyer,
running free on Cloudflare Workers.

- **Stack:** Next.js (App Router) + next-intl + Tailwind, Hono API at `/api`, Cloudflare D1 with
  Drizzle, deployed with `@opennextjs/cloudflare`. See `docs/decisions/0001-cloudflare-native-stack.md`.
- **Rules for contributors and AI agents:** `AGENTS.md`.

## Quick start

```sh
pnpm install
cp apps/web/.dev.vars.example apps/web/.dev.vars
cd apps/web
pnpm db:migrate:local   # create the local D1 database
pnpm dev                # http://localhost:3000 → redirects to /ar
```

Checks: `pnpm lint && pnpm typecheck && pnpm test`.

Run the real Worker locally: `cd apps/web && pnpm preview`.

## Deploy

Merging to `main` deploys through GitHub Actions once the Cloudflare secrets are set. Setup steps are
in `docs/runbooks/deploy.md`.
