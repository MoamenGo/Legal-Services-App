import { and, count, desc, eq, gte, like, lt, or, sql, type SQL } from 'drizzle-orm';
import { createDb } from '@/server/db/client';
import { jobs, leadNotes, leads, leadStatuses, users } from '@/server/db/schema';
import { uuidv7 } from '@/server/lib/uuid';
import type { AuthUser } from '../../env';

export const PAGE_SIZE = 25;

export type LeadFilters = {
  status?: (typeof leadStatuses)[number];
  from?: string;
  to?: string;
  campaign?: string;
  q?: string;
  page: number;
};

/** Lawyers only ever see leads assigned to them (AGENTS.md section 5). */
const visibleTo = (user: AuthUser): SQL | undefined =>
  user.role === 'lawyer' ? eq(leads.assignedTo, user.id) : undefined;

function whereFor(filters: Omit<LeadFilters, 'page'>, user: AuthUser) {
  const conditions: (SQL | undefined)[] = [visibleTo(user)];
  if (filters.status) conditions.push(eq(leads.status, filters.status));
  if (filters.from)
    conditions.push(gte(leads.createdAt, new Date(`${filters.from}T00:00:00+03:00`)));
  // `to` is inclusive: everything before the start of the next day, Riyadh time.
  if (filters.to) {
    const end = new Date(`${filters.to}T00:00:00+03:00`);
    end.setUTCDate(end.getUTCDate() + 1);
    conditions.push(lt(leads.createdAt, end));
  }
  if (filters.campaign)
    conditions.push(eq(sql`json_extract(${leads.source}, '$.utm_campaign')`, filters.campaign));
  if (filters.q) {
    const term = `%${filters.q.replace(/[%_]/g, '')}%`;
    conditions.push(or(like(leads.name, term), like(leads.phone, term), like(leads.email, term)));
  }
  return and(...conditions);
}

const listColumns = {
  id: leads.id,
  name: leads.name,
  phone: leads.phone,
  caseType: leads.caseType,
  status: leads.status,
  language: leads.language,
  source: leads.source,
  assignedTo: leads.assignedTo,
  createdAt: leads.createdAt,
};

export async function listLeads(d1: D1Database, filters: LeadFilters, user: AuthUser) {
  const db = createDb(d1);
  const where = whereFor(filters, user);
  const [items, [total]] = await Promise.all([
    db
      .select(listColumns)
      .from(leads)
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(PAGE_SIZE)
      .offset((filters.page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(leads).where(where),
  ]);
  return { items, total: total?.value ?? 0, page: filters.page, pageSize: PAGE_SIZE };
}

export async function getLead(d1: D1Database, id: string, user: AuthUser) {
  const db = createDb(d1);
  const lead = await db.query.leads.findFirst({ where: and(eq(leads.id, id), visibleTo(user)) });
  if (!lead) return null;
  const notes = await db
    .select({
      id: leadNotes.id,
      text: leadNotes.text,
      createdAt: leadNotes.createdAt,
      by: users.name,
    })
    .from(leadNotes)
    .leftJoin(users, eq(users.id, leadNotes.userId))
    .where(eq(leadNotes.leadId, id))
    .orderBy(desc(leadNotes.createdAt));
  // Delivery state of notifications and Ads uploads, so staff can see what went out.
  const leadJobs = await db
    .select({
      type: jobs.type,
      status: jobs.status,
      attempts: jobs.attempts,
      lastError: jobs.lastError,
      updatedAt: jobs.updatedAt,
    })
    .from(jobs)
    .where(eq(jobs.leadId, id))
    .orderBy(desc(jobs.createdAt));
  return { ...lead, notes, jobs: leadJobs };
}

export type LeadPatch = {
  status?: (typeof leadStatuses)[number];
  assignedTo?: string | null;
  value?: number | null;
};

export async function updateLead(d1: D1Database, id: string, patch: LeadPatch) {
  await createDb(d1)
    .update(leads)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(leads.id, id));
}

export async function addNote(d1: D1Database, leadId: string, userId: string, text: string) {
  await createDb(d1)
    .insert(leadNotes)
    .values({ id: uuidv7(), leadId, userId, text, createdAt: new Date() });
}

export async function exportLeads(
  d1: D1Database,
  filters: Omit<LeadFilters, 'page'>,
  user: AuthUser,
) {
  return createDb(d1)
    .select({
      id: leads.id,
      createdAt: leads.createdAt,
      name: leads.name,
      phone: leads.phone,
      email: leads.email,
      caseType: leads.caseType,
      status: leads.status,
      value: leads.value,
      source: leads.source,
      assignee: users.name,
    })
    .from(leads)
    .leftJoin(users, eq(users.id, leads.assignedTo))
    .where(whereFor(filters, user))
    .orderBy(desc(leads.createdAt))
    .limit(10_000);
}

/** Excel runs cells starting with these as formulas; prefixing ' keeps them as text. */
const FORMULA_START = /^[=+\-@\t\r]/;

export function toCsv(rows: (string | number | null | undefined)[][]) {
  const cell = (value: string | number | null | undefined) => {
    const text = value === null || value === undefined ? '' : String(value);
    const safe = FORMULA_START.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  // BOM so Excel opens Arabic text as UTF-8.
  return '﻿' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
}
