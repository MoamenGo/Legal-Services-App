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

## 2026-10-13: Phase 2 public site and consultation form

- What: Arabic (RTL) and English pages: home, about, services, five service pages, articles (empty
  until the CMS), contact, privacy, terms, thank-you and localized 404. Two Google Ads landing pages
  at `/[locale]/lp/[slug]` with no navigation, the short form above the fold and a sticky mobile
  bar. `POST /api/leads` validates with the shared zod schema, rate-limits 5/min per IP, checks a
  honeypot and Turnstile, and saves the lead to D1. JSON-LD (LegalService, FAQPage,
  BreadcrumbList), sitemap, robots, canonical and hreflang; landing and thank-you pages are noindex.
- Why: Phase 2 of the plan. Notifications, the queue and the admin dashboard are Phase 3.
- Verify: `pnpm lint && pnpm typecheck && pnpm test`, then `cd apps/web && pnpm db:migrate:local &&
pnpm preview`, open `/ar/lp/labor-lawyer` at 360px and submit the form (needs internet for
  Turnstile).
- Known gap: first-load JS is about 148 KB gzipped on pages with the form and 134 KB without
  (the Next.js + React baseline), above the 120 KB landing-page budget in AGENTS.md section 7.

## 2026-10-13: Phase 3a admin sign-in and leads dashboard

- What: `/api/auth/login|refresh|logout` with PBKDF2 passwords, 15-minute JWTs, rotating refresh
  sessions and a 5-attempt lockout; RBAC (admin, intake, lawyer) and an audit log. Admin API for
  leads (list with status, date, campaign and text filters; detail; status, assignee, value and
  notes; CSV export) and users. The `/admin` dashboard in Arabic with an English toggle: login,
  leads list (cards on mobile, table on desktop), lead detail, users. `pnpm seed` fills the local
  database with fake data. The deploy workflow creates `JWT_ACCESS_SECRET` and, when the
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` secrets exist, the first admin. Decisions in ADR 0003.
- Why: Phase 3 of the plan (AGENTS.md sections 4, 5 and 9).
- Verify: `pnpm test` (the API tests run against a real local D1), then
  `cd apps/web && pnpm db:migrate:local && pnpm seed && pnpm preview`, open `/admin`, sign in as
  `admin@example.com` / `local-dev-password`, change a lead's status, and sign in as
  `lawyer@example.com` to see only assigned leads.
- Not yet: notifications and the Google Ads offline conversion job (Phase 3b), TOTP 2FA.
