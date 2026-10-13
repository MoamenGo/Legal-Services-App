# Integrations runbook

Everything below is optional. Until a channel is configured its jobs show as "Not set up" on the
lead's page in `/admin` and nothing is sent. Settings marked _secret_ are set with
`cd apps/web && npx wrangler secret put <NAME>`; the others are `vars` in `apps/web/wrangler.jsonc`
(commit them) or secrets, as you prefer. After changing secrets no redeploy is needed.

## Email (staff alert and client auto-reply) with Resend

1. Create a Resend account, add and verify the firm's sending domain.
2. Secrets: `RESEND_API_KEY`, `MAIL_FROM` (e.g. `Firm name <noreply@firm-domain.sa>`),
   `INTAKE_NOTIFY_EMAILS` (comma-separated staff addresses).
3. The staff email has the name, phone, case type, preferred contact, campaign and a link to the
   lead. It never includes the client's message. The client auto-reply is sent only when the visitor
   gave an email, in the language they used.

## WhatsApp alert to staff (WhatsApp Cloud API)

WhatsApp only allows a business to start a conversation with an approved template.

1. In Meta Business Manager, create a utility template, for example name `new_lead_alert`,
   language Arabic, body: `طلب استشارة جديد ({{1}}). افتحه من لوحة التحكم: {{2}}`. `{{1}}` is the case
   type and `{{2}}` the admin link. Wait for approval.
2. Secrets: `WHATSAPP_TOKEN` (a permanent system-user token), `WHATSAPP_PHONE_NUMBER_ID`,
   `WHATSAPP_INTAKE_TEMPLATE` (the template name), `INTAKE_WHATSAPP_TO` (comma-separated staff
   numbers, e.g. `+9665XXXXXXXX`). Optional: `WHATSAPP_TEMPLATE_LANGUAGE` (default `ar`),
   `WHATSAPP_API_VERSION` (default `v21.0`).

SMS through a Saudi provider (Unifonic or Taqnyat) is not built yet; the firm should pick the
provider first.

## GA4 server-side `generate_lead`

Backup for the browser event. GA4 → Admin → Data streams → the web stream → Measurement Protocol
API secrets → Create. Secrets: `GA4_MEASUREMENT_ID` (`G-...`) and `GA4_API_SECRET`. The event carries
the lead id, case type, landing page and language, never the name or phone.

## Google Ads offline conversions

When staff set a lead from an ad (it has a `gclid`, `gbraid` or `wbraid`) to **Qualified** or
**Retained**, one upload per stage is queued. The result is stored on the lead
(`conversions_uploaded`) and shown on its page.

1. In Google Ads create two conversion actions of type _Import → CRM / clicks_: "Qualified lead" and
   "Retained client". Note each action's id (the number in its URL, `ctId=`).
2. Apply for a Google Ads API developer token (Tools → API Center). Basic access is enough.
3. Create an OAuth client (Google Cloud console) and a refresh token for a user with access to the
   Ads account (scope `https://www.googleapis.com/auth/adwords`).
4. Secrets: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`,
   `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID` (digits, dashes allowed),
   `GOOGLE_ADS_CONVERSION_ACTION_QUALIFIED`, `GOOGLE_ADS_CONVERSION_ACTION_RETAINED`, and
   `GOOGLE_ADS_LOGIN_CUSTOMER_ID` if access goes through a manager account. Optional:
   `GOOGLE_ADS_API_VERSION` (default `v21`; Google retires versions about yearly, so update it when
   uploads start failing with a version error).

A click older than the conversion action's window is rejected by Google; that shows as "Failed" and
is not retried.

## Checking jobs

`npx wrangler d1 execute DB --remote --command "select type, status, attempts, last_error from jobs order by created_at desc limit 20"`
