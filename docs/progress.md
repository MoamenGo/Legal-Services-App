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

## 2026-10-13: Phase 3b lead notifications and Google Ads conversions

- What: a D1 `jobs` outbox (ADR 0004). Each new lead queues a staff email, a staff WhatsApp
  template message, a client auto-reply email and a GA4 Measurement Protocol `generate_lead`.
  Setting a lead from an ad to qualified or retained queues one Google Ads offline conversion
  upload per stage and records the result on the lead. Jobs run right after the response and a
  10-minute cron retries failures (1 min, 5 min, 30 min, 2 h, then failed). Every integration is
  optional and skipped until configured. The lead page in `/admin` shows each job's state.
  `worker.ts` is now the Worker entry, wrapping OpenNext and adding the cron handler.
- Why: AGENTS.md section 6, on the free plan without Cloudflare Queues.
- Verify: `pnpm test` (runner, backoff, double-run guard and each handler against a local D1), then
  `cd apps/web && pnpm build:worker && npx wrangler dev --test-scheduled` and open
  `/__scheduled?cron=*/10+*+*+*+*`. Setup per channel: `docs/runbooks/integrations.md`.
- Not yet: SMS (needs the firm to pick Unifonic or Taqnyat), Sentry alerting.

## 2026-10-13: Phase 4a tracking and funnel report

- What: GTM loads only when the `NEXT_PUBLIC_GTM_ID` repository variable is set, after an inline
  Consent Mode v2 default (denied, or the saved choice). Bilingual consent banner with equal
  Accept and Essential-only buttons, reopened from the footer. First-party `lsa_attr` cookie
  (90 days, first and last touch) feeds the lead form, so a gclid survives later direct visits.
  `click_to_call` and `whatsapp_click` are pushed from any `[data-event]` link. Enhanced
  Conversions: hashed email and phone on `generate_lead`, only with consent. Funnel report at
  `/admin/reports` (by campaign, keyword or landing page) and `GET /api/admin/reports/funnel`.
  `docs/tracking-plan.md` documents every event, tag, trigger and variable; the importable
  container is `docs/gtm-container.json`. The privacy policy has a cookies section.
- Why: AGENTS.md section 8 and the funnel report in section 5.
- Verify: `pnpm test`, then preview and open `/ar/lp/labor-lawyer?gclid=TEST`: the banner shows,
  `dataLayer[0]` is the denied consent default, and the `lsa_attr` cookie holds the gclid. Sign in
  to `/admin` and open Reports.

## 2026-10-13: Phase 4b articles, firm settings and publishing

- What: `articles` and `settings` tables with admin API and screens (Articles list and editor in
  Arabic and optional English, Settings for phone, WhatsApp, email, address and hours, Publish
  button). Public `/[locale]/articles` and article pages with Article and BreadcrumbList JSON-LD,
  in the sitemap. The contact page, footer, sticky bar and LegalService JSON-LD use the Settings
  values. The Deploy workflow exports published content from D1 before building; Publish starts
  that workflow (also `POST /api/webhooks/revalidate`). OpenNext now serves prerendered pages
  from static assets instead of rendering each request. Shared zod schemas in
  `packages/schemas/src/content.ts`. ADR 0005.
- Why: AGENTS.md sections 5 and 12 (CMS, settings, revalidation) within the free plan.
- Verify: `pnpm test`, then `cd apps/web && pnpm seed && pnpm content:export --local && pnpm preview`,
  open `/ar/articles/sample-article` and `/ar/contact`, and edit both in `/admin`.
- Not yet: editing services and landing pages in the dashboard (they stay in code), media uploads
  (R2 needs a card on file).

## 2026-10-13: Phase 6 launch prep (retention, security headers, redirects, runbooks)

- What: a daily cron anonymizes leads older than `LEAD_RETENTION_MONTHS` (24) and clears old
  sessions; admins can delete a client's personal data on request from the lead page
  (`POST /api/admin/leads/:id/anonymize`, audited). Every response carries a CSP that allows only
  GTM, GA4, Google Ads and Turnstile, plus HSTS, nosniff, Referrer-Policy, COOP and
  Permissions-Policy. Old-site URLs in `docs/redirect-map.csv` become 301 redirects at build time.
  Runbooks for rollback, backup/restore and launch, and the Arabic staff guide
  `docs/admin-guide-ar.md`. Placeholder browser-tab icon.
- Why: AGENTS.md section 9 and Phase 6; ADR 0006 records the retention and CSP choices.
- Verify: `pnpm test` (retention, anonymize route, redirect map, headers), then
  `cd apps/web && pnpm db:migrate:local && pnpm preview` and `curl -I http://localhost:8787/ar`.
  Pages, the lead form and `/admin` load with no CSP errors in the browser console.
