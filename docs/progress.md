# Progress

## 2026-10-11: Phase 1 skeleton

- What: pnpm + Turborepo monorepo, Next.js on Cloudflare Workers (OpenNext), next-intl with `/ar`
  (default, RTL) and `/en`, Tailwind v4, Hono API at `/api` with `/api/health`, D1 + Drizzle with the
  `leads` table, shared zod lead schema with Saudi phone normalization, CI and deploy workflows.
- Why: ADR 0001, stack approved for a free Cloudflare deploy; template scope is site + leads.
- Verify: `pnpm install && pnpm lint && pnpm typecheck && pnpm test`, then
  `cd apps/web && pnpm db:migrate:local && pnpm preview` and open `/ar` and `/api/health`.

## 2026-10-12: Fix the first production deploy

- What: the Worker build scripts (`build:worker`, `deploy`, `preview`, `upload`) now run
  `pnpm cf-typegen` first, which generates `cloudflare-env.d.ts` (it is gitignored).
- Why: the first Deploy run on main failed with `Cannot find name 'D1Database'`, because only
  `typecheck` generated those types and the deploy job does not run it.
- Verify: `cd apps/web && rm -f cloudflare-env.d.ts && pnpm build:worker` succeeds.
