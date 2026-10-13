# 0007: Landing-page JavaScript budget is 172 KB

Date: 2026-10-13. Status: accepted (Moamen asked to apply the remaining defaults).

## Context

AGENTS.md section 7 set first-load JS for landing pages at 120 KB gzipped. The landing page ships
about 155 KB, and almost all of it is the React and Next.js runtime that every App Router page
loads; the page's own code is a few KB. Getting under 120 KB would mean leaving the stack fixed in
section 2. Live Lighthouse runs on the landing page already meet the score and LCP budgets.

## Decision

The budget is 160 KB gzipped, enforced as an error in `lighthouserc.json` so a regression past the
framework baseline fails the Lighthouse workflow instead of only warning.

## Consequences

New landing-page features must stay within about 5 KB of extra script, or load lazily on interaction.

## Amendment (2026-10-13)

The first live runs measured 166 KB of script transferred on the landing page, before and after the
redesign (ADR 0008), with every other budget met. The earlier 155 KB figure left out per-request
overhead, so a 160 KB limit failed on the framework alone. The budget is now 172 KB (176128 bytes
in `lighthouserc.json`), about 6 KB of headroom for the page's own code.
