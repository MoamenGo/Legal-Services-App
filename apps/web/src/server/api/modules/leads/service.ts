import type { LeadInput } from '@app/schemas';
import { createDb } from '@/server/db/client';
import { leads } from '@/server/db/schema';
import { uuidv7 } from '@/server/lib/uuid';

/** Saves a validated lead with status `new` and returns its id. */
export async function createLead(d1: D1Database, input: LeadInput): Promise<string> {
  const id = uuidv7();
  const now = new Date();
  await createDb(d1)
    .insert(leads)
    .values({
      id,
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      caseType: input.caseType,
      message: input.message ?? null,
      preferredContact: input.preferredContact,
      language: input.language,
      source: input.source,
      status: 'new',
      privacyAcceptedAt: now,
      marketingConsent: input.marketingConsent,
      createdAt: now,
      updatedAt: now,
    });
  return id;
}
