# Tracking plan

The site loads **only** Google Tag Manager, and only when `NEXT_PUBLIC_GTM_ID` is set (a GitHub
repository variable, read at build time). GA4 and Google Ads live inside GTM. The prepared container
is `docs/gtm-container.json`; a human imports it (AGENTS.md hard rule 1).

## Consent (Consent Mode v2)

- An inline script in `<head>` runs before GTM. It sets `ad_storage`, `ad_user_data`,
  `ad_personalization` and `analytics_storage` to **denied**, or to the visitor's saved choice
  (`lsa_consent` cookie, 180 days). It also turns on `ads_data_redaction` and `url_passthrough`.
- The bilingual banner offers **Accept** and **Essential only** with equal weight. A choice calls
  `gtag('consent', 'update', …)` and pushes `{ event: 'consent_update', consent }`.
- "Cookie settings" in the footer reopens the banner.
- Google tags have built-in consent checks: before consent GA4 sends cookieless pings and Ads
  uses modelling; nothing is stored.

## First-party attribution (`lsa_attr` cookie)

Set on every page load by `src/lib/attribution.ts` (90 days, `SameSite=Lax`, `Secure`). It is our
own cookie, used only to attach the source to a lead the visitor chooses to send, and is described in
the privacy policy.

- **First touch:** the first visit's landing page, external referrer and any UTM or click ids.
- **Last touch:** replaced only when a visit carries UTM params or a click id, so later direct visits
  keep the `gclid`.
- The lead form sends the last touch as `source` (`utm_*`, `gclid`, `gbraid`, `wbraid`,
  `landingPage`, `referrer`, `device`) and the first touch as `first_utm_source`,
  `first_utm_campaign`, `first_landingPage`, `first_referrer` when it differs.

## dataLayer events

| Event              | Fields                                                                           | Fired by                                    |
| ------------------ | -------------------------------------------------------------------------------- | ------------------------------------------- |
| `generate_lead`    | `lead_id`, `case_type`, `form_location`, `language`, and `user_data` (see below) | Thank-you page, once per lead               |
| `click_to_call`    | `location` (`sticky_bar`, `contact_page`, or the page path)                      | Any link with `data-event="click_to_call"`  |
| `whatsapp_click`   | `location`                                                                       | Any link with `data-event="whatsapp_click"` |
| `form_start`       | `form_location` (`home_hero`, `service_<slug>`, `lp_<slug>`, `contact`, …)       | First interaction with a consultation form  |
| `booking_complete` | `booking_id`                                                                     | Reserved; the booking module is not built   |
| `consent_update`   | `consent` (`granted`/`denied`)                                                   | Consent banner                              |

The server also sends `generate_lead` through the GA4 Measurement Protocol as a backup, with
`source: server` (see `docs/runbooks/integrations.md`). Filter on that parameter in reports to avoid
counting a lead twice.

## Enhanced Conversions

When the form succeeds, the browser normalizes the email (trimmed, lowercase) and phone (E.164),
hashes each with SHA-256 and keeps only the hashes in `sessionStorage`. The thank-you page reads and
deletes them, and adds `user_data: { sha256_email_address, sha256_phone_number }` to
`generate_lead` **only when consent is granted**. Plain email or phone never reach the dataLayer.

## GTM container (`docs/gtm-container.json`)

### Variables

| Name                                                        | Type                       | Value                                              |
| ----------------------------------------------------------- | -------------------------- | -------------------------------------------------- |
| GA4 Measurement ID                                          | Constant                   | `G-XXXXXXXXXX` → replace                           |
| Ads Conversion ID                                           | Constant                   | `AW-XXXXXXXXX` → replace                           |
| Ads Label - Lead                                            | Constant                   | label of the "Lead form" conversion → replace      |
| Ads Label - Call click                                      | Constant                   | label of the "Call click" conversion → replace     |
| Ads Label - WhatsApp click                                  | Constant                   | label of the "WhatsApp click" conversion → replace |
| DLV - lead_id, case_type, form_location, language, location | Data Layer Variable        | event fields                                       |
| DLV - sha256_email_address, sha256_phone_number             | Data Layer Variable        | `user_data.*`                                      |
| User-provided data (hashed)                                 | User-Provided Data, manual | the two hashed DLVs                                |

### Triggers

`CE - generate_lead`, `CE - click_to_call`, `CE - whatsapp_click`, `CE - form_start`,
`CE - booking_complete`: Custom Event, exact event name.

### Tags

| Tag                                                                     | Type                                                                          | Trigger                    |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------- |
| Google tag - GA4                                                        | Google tag                                                                    | Initialization - All Pages |
| Conversion Linker                                                       | Conversion Linker (URL passthrough on)                                        | All Pages                  |
| GA4 event - generate_lead / click_to_call / whatsapp_click / form_start | GA4 Event, with the fields above                                              | matching CE trigger        |
| Google Ads - Lead (form)                                                | Ads Conversion, order id = lead id, Enhanced Conversions from the hashed data | CE - generate_lead         |
| Google Ads - Call click                                                 | Ads Conversion                                                                | CE - click_to_call         |
| Google Ads - WhatsApp click                                             | Ads Conversion                                                                | CE - whatsapp_click        |

Offline conversions for **Qualified** and **Retained** are uploaded from the server, not GTM.

## Setting it up (human steps)

1. Google Ads → Goals → Conversions: create "Lead form" (website, primary), "Call click" and
   "WhatsApp click" (website, secondary), and the two import actions from
   `docs/runbooks/integrations.md`. Turn on Enhanced Conversions for leads ("Google Tag Manager").
2. GA4: create a property and web stream; mark `generate_lead` as a key event.
3. GTM: create a Web container → Admin → Import container → `docs/gtm-container.json` →
   _Merge_ → _Rename conflicting_. Replace the five constants. Preview on the site, then publish.
4. GitHub → Settings → Secrets and variables → Actions → **Variables** → `NEXT_PUBLIC_GTM_ID` =
   the container id. Re-run Deploy.
5. Check in GTM Preview: before consent, the Google tag fires with consent denied; after
   **Accept**, events carry full measurement; a test lead shows `generate_lead` with `user_data`.

If GTM rejects part of the import (Google changes tag templates), create that item by hand from the
tables above.
