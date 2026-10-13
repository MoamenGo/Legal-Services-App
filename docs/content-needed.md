# Content needed from the firm

Everything the site shows as `[CLIENT TO PROVIDE]`. Nothing here may be invented (AGENTS.md rule 4).
Text lives in `apps/web/messages/ar.json` and `en.json`. Contact details, address and hours are
entered by an admin in **/admin → Settings** and go live with **Publish changes** (ADR 0005).

## Firm identity

- [ ] Firm name in Arabic and English (`common.firmName`)
- [ ] Logo (SVG preferred) and brand colours, if different from the template's navy and gold; the
      browser-tab icon `apps/web/src/app/icon.svg` is a generic placeholder (scales of justice)
- [ ] Saudi Bar licence number(s) shown in the footer and trust block

## Contact (/admin → Settings)

- [ ] Phone number for click-to-call (Saudi mobile or landline)
- [ ] WhatsApp Business number
- [ ] Public email, and the email for privacy requests (privacy policy text)
- [ ] Address and office hours in Arabic and English

## Trust block (real numbers only)

- [ ] Years of experience
- [ ] Number of cases handled or clients served, if the firm wants to show it
- [ ] Number of lawyers

## About and team

- [ ] Short introduction to the firm and its approach (`about.intro`, `about.mission`)
- [ ] For each lawyer: name, title, short bio, licence number, professional photo

## Services

- [ ] Confirm the five practice areas (family, labour, commercial, criminal, real estate) and edit
      or replace their descriptions and FAQs
- [ ] Consultation fees, or the wording the firm wants (`faq.items[2]`)

## Landing pages (Google Ads)

- [ ] Ad groups and keywords, so each landing page headline mirrors its keyword
      (`src/content/landing-pages.ts` and `landing.pages.<slug>`)

## Old website

- [ ] Address of the current site, so its URLs can be listed in `docs/redirect-map.csv`
      (each old page gets a 301 to its new page; see `docs/runbooks/launch-checklist.md`)

## Legal pages

- [ ] Review of the privacy policy (PDPL) and terms by the firm's counsel; both are drafts

## Accounts and keys (set by the firm or its admin, never sent in chat)

- [ ] Turnstile site key and secret (see `docs/runbooks/deploy.md`)
