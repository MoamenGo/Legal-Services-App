# 0002: Turnstile test keys by default

- Status: accepted
- Date: 2026-10-13

## Context

The lead form must be verified server-side with Cloudflare Turnstile (AGENTS.md section 9). The
template is deployed before the firm creates its own Turnstile widget, and the demo form should
still work end to end.

## Decision

- The site key comes from `NEXT_PUBLIC_TURNSTILE_SITE_KEY` at build time and falls back to
  Cloudflare's public test key `1x00000000000000000000AA`.
- The API verifies every token with `siteverify`. It uses `TURNSTILE_SECRET_KEY` when set; when it
  is absent **and** the site key is the test key, it uses the matching public test secret. With a
  real site key and no secret, the API answers 503 instead of accepting unverified leads.
- Honeypot and the 5-requests-a-minute rate limit apply either way.

## Consequences

- The demo works with no setup, but the test keys stop no bots. Switching to real keys is a launch
  step in `docs/runbooks/deploy.md` and `docs/content-needed.md`.
- No secret is committed: both test values are published in Cloudflare's documentation.
