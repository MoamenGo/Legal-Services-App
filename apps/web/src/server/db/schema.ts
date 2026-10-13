import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const leadStatuses = [
  'new',
  'contacted',
  'qualified',
  'consultation_booked',
  'retained',
  'lost',
  'spam',
] as const;

export const leads = sqliteTable(
  'leads',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    caseType: text('case_type').notNull(),
    message: text('message'),
    preferredContact: text('preferred_contact').notNull(),
    language: text('language').notNull(),
    /** JSON: utm_*, gclid/gbraid/wbraid, landingPage, referrer, device. */
    source: text('source', { mode: 'json' })
      .notNull()
      .default(sql`'{}'`),
    status: text('status', { enum: leadStatuses }).notNull().default('new'),
    assignedTo: text('assigned_to'),
    privacyAcceptedAt: integer('privacy_accepted_at', { mode: 'timestamp' }).notNull(),
    marketingConsent: integer('marketing_consent', { mode: 'boolean' }).notNull().default(false),
    /** Estimated case value in SAR, set by staff for reporting and Ads conversion value. */
    value: integer('value'),
    /** JSON: [{ action, at, ok, error? }] from Google Ads offline conversion uploads. */
    conversionsUploaded: text('conversions_uploaded', { mode: 'json' })
      .$type<{ action: string; at: string; ok: boolean; error?: string }[]>()
      .notNull()
      .default(sql`'[]'`),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('leads_created_at_idx').on(t.createdAt),
    index('leads_status_idx').on(t.status),
    index('leads_phone_idx').on(t.phone),
    index('leads_assigned_to_idx').on(t.assignedTo),
    index('leads_utm_campaign_idx').on(sql`json_extract(${t.source}, '$.utm_campaign')`),
  ],
);

export const userRoles = ['admin', 'lawyer', 'intake'] as const;
export type UserRole = (typeof userRoles)[number];

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  /** `pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>` */
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: userRoles }).notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  failedLogins: integer('failed_logins').notNull().default(0),
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/** Refresh-token sessions. Only a SHA-256 of the token is stored. */
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
);

export const leadNotes = sqliteTable(
  'lead_notes',
  {
    id: text('id').primaryKey(),
    leadId: text('lead_id')
      .notNull()
      .references(() => leads.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    text: text('text').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('lead_notes_lead_id_idx').on(t.leadId)],
);

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    /** JSON: changed fields as { field: [before, after] }; never lead PII values. */
    diff: text('diff', { mode: 'json' }),
    ip: text('ip'),
    at: integer('at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [
    index('audit_log_entity_idx').on(t.entity, t.entityId),
    index('audit_log_at_idx').on(t.at),
  ],
);

export const jobTypes = [
  'intake_email',
  'intake_whatsapp',
  'client_email',
  'ga4_lead',
  'ads_conversion',
] as const;
export type JobType = (typeof jobTypes)[number];
export const jobStatuses = ['pending', 'done', 'skipped', 'failed'] as const;

/**
 * Outbox for work that must not slow down or fail the request that caused it (AGENTS.md section 6).
 * Rows run right after the response and are retried by the cron trigger with backoff (ADR 0004).
 */
export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    type: text('type', { enum: jobTypes }).notNull(),
    leadId: text('lead_id').references(() => leads.id),
    /** JSON input for the handler; never more PII than the handler needs. */
    payload: text('payload', { mode: 'json' })
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'`),
    /** Stops the same job being queued twice, e.g. one Ads upload per lead and status. */
    dedupeKey: text('dedupe_key').unique(),
    status: text('status', { enum: jobStatuses }).notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    runAfter: integer('run_after', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    lastError: text('last_error'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index('jobs_due_idx').on(t.status, t.runAfter), index('jobs_lead_id_idx').on(t.leadId)],
);
