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
  ],
);
