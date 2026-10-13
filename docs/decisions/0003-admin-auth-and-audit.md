# 0003: Admin sign-in, sessions and audit log

- Status: accepted
- Date: 2026-10-13

## Context

AGENTS.md section 2 asks for a 15-minute JWT access token, a refresh token in an httpOnly cookie,
PBKDF2 via Web Crypto, lockout after 5 failed logins, RBAC and an audit entry for every admin read
and write of a lead. The Worker runs on the free plan (10 ms CPU per request, with occasional
overruns allowed).

## Decision

- **Passwords:** PBKDF2-SHA256, 100,000 iterations, 16-byte random salt. 100,000 is the most the
  Workers runtime accepts. One hash costs about 50 ms of CPU, more than the free plan's 10 ms, but
  Cloudflare tolerates occasional overruns and only a login pays it. The iteration count is stored
  in each hash, so it can be raised later (for example on a paid plan) without resetting passwords.
- **Access token:** HS256 JWT signed with `JWT_ACCESS_SECRET`, 15 minutes, kept only in browser
  memory. The deploy workflow creates the secret with a random value when it is missing.
- **Refresh token:** an opaque 256-bit random value, not a JWT. Only its SHA-256 is stored in the
  `sessions` table, so it can be revoked (logout, deactivation) and is rotated on every refresh. It
  lives in an httpOnly, `SameSite=Strict` cookie scoped to `/api/auth`, valid 14 days. This
  replaces the `JWT_REFRESH_SECRET` named in AGENTS.md, which is therefore not used.
- **Lockout:** 5 wrong passwords lock the account for 15 minutes. Unknown emails get the same answer
  and the same hashing work, so the API does not reveal which emails exist. Login is also limited to
  10 attempts a minute per IP. Refresh and logout are not limited, so staff sharing one office IP
  cannot lock each other out by opening pages.
- **Lead notes:** a `lead_notes` table instead of the JSON `notes` array in the AGENTS.md model,
  so notes can be added without rewriting the lead row and carry the author as a real reference.
- **Audit log:** `audit_log` rows for sign-in, every lead list, read, update, note and CSV export,
  and every user create and update. Diffs hold changed field names with before and after values,
  never lead PII; password changes show as `***`.
- **Admin UI language:** Arabic by default with an English toggle remembered per browser. It is a
  client-rendered area outside `/[locale]`, so it is not indexed and needs no i18n routing.

## Consequences

- The first admin comes from the `ADMIN_EMAIL` and `ADMIN_PASSWORD` repository secrets (inserted
  once by the deploy workflow) or from `pnpm seed` locally. Later users are added in `/admin/users`.
- An attacker who steals a refresh cookie keeps access for at most 14 days or until the user signs
  out or is deactivated; rotation makes reuse of an old cookie fail.
- TOTP 2FA (optional in AGENTS.md section 9) is not built yet.
