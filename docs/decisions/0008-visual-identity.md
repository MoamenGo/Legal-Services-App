# 0008: Visual identity for the public site

Date: 2026-10-13. Status: accepted (Moamen asked for a creative, modern design for the whole site).

## Context

The first build used navy and gold with system-style cards, the default look of most law-firm
sites. The firm's own identity (logo, colours) is still `[CLIENT TO PROVIDE]`, so the template needs
a look that is distinctive, rooted in Riyadh, and easy to re-skin when the firm's brand arrives.

## Decision

- **Palette:** pine ink `#133B35` (primary, hero, footer), gypsum `#F2F4F1` (alternate sections),
  white, ink text `#1C2A27` with muted `#52625E`, and saffron (`#E0AD4A` on pine, `#946412` on
  white for focus rings and numerals). Saffron and pine come from painted Najdi doors and old-town
  plaster; the `brand-*` token names are kept so `/admin` follows the palette.
- **Type:** Reem Kufi (geometric Kufi, Arabic and Latin) for headings; IBM Plex Sans Arabic for
  body and forms. Reem Kufi uses `display: optional` without a preload because the hero
  headline is the LCP element: a late swap, or a preload competing with the CSS on slow 4G, moved
  LCP past the 2.5 s budget on the live runs. First visits on a slow connection may show the body
  face in headings; later page views use Reem Kufi from cache.
- **Signature:** a Najdi parapet (the triangular crenellation of At-Turaif walls) drawn with a CSS
  mask on the top edge of pine blocks: the hero, the landing-page final call to action and the
  footer. It is the one decorative device; everything else stays quiet.
- **Layout:** practice areas are an index of rows rather than a grid of cards; the three steps keep
  their numbers because they are a sequence; the trust facts sit on a pine band; FAQs are ruled rows.

## Consequences

To re-skin for a firm, change the tokens at the top of `apps/web/src/app/globals.css` and the
display font in `apps/web/src/app/fonts.ts`; components use the tokens, not raw colours. No new
JavaScript; one extra font family (two woff2 files, 32 KB, not preloaded).
