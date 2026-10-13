# Launch checklist

Everything a human does before real ad traffic reaches the site. The agent prepares; the firm or
its admin applies (AGENTS.md rule 1).

## Content and legal

- [ ] Every item in `docs/content-needed.md` is filled in, and no page shows `[CLIENT TO PROVIDE]`
      (search the built site or `apps/web/messages/*.json`).
- [ ] The firm's counsel has approved the privacy policy and terms (PDPL), and the advertising
      wording against Saudi Bar rules.
- [ ] Legal sign-off on storing lead data in Cloudflare D1, which has no GCC region (AGENTS.md
      section 2).

## Accounts and keys

- [ ] Real Turnstile keys (`docs/runbooks/deploy.md`); test keys accept every visitor.
- [ ] Email, WhatsApp, GA4 and Google Ads secrets as needed (`docs/runbooks/integrations.md`).
- [ ] GTM container imported from `docs/gtm-container.json` and published; `NEXT_PUBLIC_GTM_ID`
      repository variable set; consent banner checked in GTM preview mode.
- [ ] First admin created, other staff added in **Users**, the `ADMIN_*` secrets deleted.
- [ ] `GITHUB_DEPLOY_TOKEN` set so **Publish changes** works.

## Domain and old site

- [ ] `docs/redirect-map.csv` lists every URL of the old site (from the Phase 1 crawl) with its new
      page. Build and spot-check a few: `curl -I https://<new-domain>/<old-path>` returns 301 to
      the new page.
- [ ] Custom domain added to the Worker (Cloudflare dashboard → Worker → Settings → Domains),
      `NEXT_PUBLIC_SITE_URL` in `wrangler.jsonc` changed to it, Turnstile hostname updated.
- [ ] DNS switched by the firm's DNS owner. Keep the old host serving redirects if it was on a
      different domain.
- [ ] Google Search Console: new property, submit `/sitemap.xml`.
- [ ] Google Ads final URLs point at `/ar/lp/<slug>` pages with auto-tagging on.

## Checks on the live domain

- [ ] Submit a test lead from a phone on 4G with a `?gclid=TEST` URL, then mark it **spam** in the
      dashboard. Notifications arrive; GA4 DebugView shows `generate_lead`.
- [ ] Security headers: `curl -I https://<domain>/ar` shows Content-Security-Policy, HSTS,
      nosniff and Referrer-Policy. Browser console shows no CSP errors with GTM loaded.
- [ ] Lighthouse mobile on `/ar` and one landing page meets the budgets in AGENTS.md section 7.
- [ ] `pnpm audit` has no high or critical findings.
- [ ] Backups: first manual export done (`docs/runbooks/backup-restore.md`).
