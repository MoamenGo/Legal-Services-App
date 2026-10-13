# 0005: Publish content by rebuilding the static site

- Status: accepted
- Date: 2026-10-13

## Context

Staff edit articles and firm details (phone, WhatsApp, address, hours) in `/admin`. AGENTS.md
asks for ISR with a revalidation webhook. On the Workers free plan a request gets 10 ms of CPU, and
rendering a Next.js page per request regularly needs more. ISR on OpenNext also needs a writable
incremental cache (R2, which requires a card on file, or KV) plus a queue for revalidation.

## Decision

- Public pages stay fully static. OpenNext serves them from Workers static assets
  (`staticAssetsIncrementalCache` with cache interception), so a page view costs no render CPU.
  Before this, with no cache configured, every "static" page was actually rendered per request.
- Content lives in D1 (`articles`, `settings`). The Deploy workflow exports published content
  to `.content/cms.json` (`scripts/export-content.ts`) right before `next build`, and pages read
  that file at build time.
- **Publish changes** in `/admin` (and `POST /api/webhooks/revalidate` with `REVALIDATE_SECRET`)
  start the Deploy workflow through the GitHub API, using a fine-grained token limited to this
  repository's Actions. Changes go live in about 3 to 5 minutes.
- Article bodies are plain text with `## ` headings and `- ` lists, rendered as React elements.
  No HTML is ever stored or rendered, so no sanitizer is needed (AGENTS.md section 9's DOMPurify
  rule exists for rich HTML, which this avoids).
- Services and landing pages stay in code and message files for now; they change rarely and carry
  structured FAQs and ad-group copy that a developer edits with the ads.

## Consequences

- No runtime rendering cost and no extra Cloudflare products.
- Publishing takes minutes, not seconds, and needs the `GITHUB_DEPLOY_TOKEN` secret; without it,
  saved content goes live with the next deploy.
- Every deploy also picks up the latest content, so a code merge never reverts published edits.
