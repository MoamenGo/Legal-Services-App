import { and, eq, inArray, isNull, lt, or } from 'drizzle-orm';
import { createDb } from '@/server/db/client';
import { jobs, leadNotes, leads, sessions } from '@/server/db/schema';

export const DEFAULT_RETENTION_MONTHS = 24;
const BATCH = 50;

/** Campaign fields are kept so old leads still count in funnel reports; click ids and referrers go. */
const KEPT_SOURCE_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'first_utm_source',
  'first_utm_campaign',
  'device',
] as const;

/** Paths only: a query string can carry click ids or whatever a visitor typed into a URL. */
const pathOnly = (value: unknown) =>
  typeof value === 'string' ? value.split(/[?#]/)[0] || undefined : undefined;

export function anonymizedSource(source: unknown): Record<string, unknown> {
  const input = source && typeof source === 'object' ? (source as Record<string, unknown>) : {};
  const kept: Record<string, unknown> = {};
  for (const key of KEPT_SOURCE_KEYS) if (input[key] !== undefined) kept[key] = input[key];
  const landingPage = pathOnly(input.landingPage);
  if (landingPage) kept.landingPage = landingPage;
  const firstLandingPage = pathOnly(input.first_landingPage);
  if (firstLandingPage) kept.first_landingPage = firstLandingPage;
  return kept;
}

export function retentionMonths(value: string | undefined) {
  const months = Number(value);
  return Number.isInteger(months) && months > 0 ? months : DEFAULT_RETENTION_MONTHS;
}

/** Clears the PII of the given leads, their notes and their job payloads in one batch. */
async function anonymize(d1: D1Database, rows: { id: string; source: unknown }[], now: Date) {
  const db = createDb(d1);
  const ids = rows.map((lead) => lead.id);
  await db.batch([
    // Notes are free text written about the client, so they go with the rest of the PII.
    db.delete(leadNotes).where(inArray(leadNotes.leadId, ids)),
    db.update(jobs).set({ payload: {} }).where(inArray(jobs.leadId, ids)),
    ...rows.map((lead) =>
      db
        .update(leads)
        .set({
          name: '',
          phone: '',
          email: null,
          message: null,
          source: anonymizedSource(lead.source),
          anonymizedAt: now,
          updatedAt: now,
        })
        .where(eq(leads.id, lead.id)),
    ),
  ]);
}

/**
 * Strips PII from leads older than the retention period (AGENTS.md section 9, ADR 0006). The row
 * stays, with its status, case type, value and campaign, so reports keep their history.
 */
export async function anonymizeOldLeads(d1: D1Database, months: number, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  const db = createDb(d1);
  let total = 0;
  for (;;) {
    const batch = await db
      .select({ id: leads.id, source: leads.source })
      .from(leads)
      .where(and(lt(leads.createdAt, cutoff), isNull(leads.anonymizedAt)))
      .limit(BATCH);
    if (batch.length === 0) break;
    await anonymize(d1, batch, now);
    total += batch.length;
  }
  return total;
}

/** A client's deletion request under PDPL: same treatment as the retention job, right away. */
export async function anonymizeLead(d1: D1Database, id: string, now = new Date()) {
  const lead = await createDb(d1).query.leads.findFirst({
    where: eq(leads.id, id),
    columns: { id: true, source: true },
  });
  if (!lead) return false;
  await anonymize(d1, [lead], now);
  return true;
}

/** Expired or revoked refresh sessions have no use after their lifetime; keep the table small. */
export async function deleteStaleSessions(d1: D1Database, now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  await createDb(d1)
    .delete(sessions)
    .where(or(lt(sessions.expiresAt, now), lt(sessions.revokedAt, weekAgo)));
}
