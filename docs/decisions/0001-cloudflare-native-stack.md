# 0001: Cloudflare-native stack instead of MERN

- Status: Accepted (approved by Moamen, 2026-10-11)
- Supersedes: AGENTS.md section 2 as originally written (Express, MongoDB, BullMQ + Redis, GCC hosting)

## Context

The template must run on a free host. The MERN stack has no good always-free home: BullMQ needs an
always-on worker, and free Node hosts sleep when idle, which breaks the 500 ms lead response target.

## Decision

One Next.js app (App Router) deployed to Cloudflare Workers with the OpenNext adapter.

| Concern        | Choice                                                                              |
| -------------- | ----------------------------------------------------------------------------------- |
| API            | Hono, mounted at `/api` through a Next route handler                                |
| Database       | Cloudflare D1 (SQLite) with Drizzle ORM and SQL migrations in `apps/web/migrations` |
| Jobs           | Cloudflare Queues (added with the lead pipeline)                                    |
| Scheduled jobs | Cron Triggers                                                                       |
| Files          | Cloudflare R2                                                                       |
| Captcha        | Turnstile                                                                           |
| Email          | Resend free tier (SES later if needed)                                              |

Scope for the template is the public site plus lead intake and the admin dashboard. The practice
module (clients, cases, hearings, invoices) is out of scope.

## Consequences

- No Mongo, Express, BullMQ or Redis; `ObjectId` fields become text ids (UUID v7).
- argon2 native bindings do not run on Workers; password hashing uses Web Crypto (PBKDF2) or a WASM build.
- D1 and R2 have no Saudi or GCC region. Fine for the template and demos; a live client with real
  data needs legal sign-off under PDPL or a move to a GCC-hosted stack.
- Next.js is pinned to 16.3.x because Next 16.4.0 fails at runtime under OpenNext 1.20.10
  (`Unexpected loadManifest(/.next/server/preview-props.json)`). Revisit when OpenNext supports 16.4.
