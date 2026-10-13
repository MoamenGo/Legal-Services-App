import { eq, sql } from 'drizzle-orm';
import { createDb } from '@/server/db/client';
import { leads, type jobs } from '@/server/db/schema';
import type { JobsEnv } from './env';
import { mailLang, mailText } from './messages';

export type JobRow = typeof jobs.$inferSelect;
export type Outcome =
  | { outcome: 'done' }
  | { outcome: 'skipped'; reason: string }
  /** Permanent: retrying would give the same answer (e.g. Google rejected the click id). */
  | { outcome: 'failed'; reason: string };

type Handler = (env: JobsEnv, job: JobRow) => Promise<Outcome>;
type Lead = typeof leads.$inferSelect;
type Source = Partial<Record<string, string>>;

const skipped = (reason: string): Outcome => ({ outcome: 'skipped', reason });
const list = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

async function loadLead(env: JobsEnv, job: JobRow) {
  if (!job.leadId) return null;
  return (
    (await createDb(env.DB).query.leads.findFirst({ where: eq(leads.id, job.leadId) })) ?? null
  );
}

/** Throws with the provider's status only, so retries happen and no response body (or PII) is logged. */
async function send(service: string, url: string, init: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${service} answered ${res.status}`);
  return res;
}

async function sendEmail(
  env: JobsEnv,
  key: string,
  mail: { to: string[]; subject: string; text: string },
) {
  await send('resend', 'https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
      // Resend drops a repeat with the same key, so a retry after a timeout cannot send twice.
      'idempotency-key': key,
    },
    body: JSON.stringify({ from: env.MAIL_FROM, ...mail }),
  });
}

const adminLink = (env: JobsEnv, lead: Lead) =>
  `${(env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')}/admin/lead?id=${lead.id}`;

const intakeEmail: Handler = async (env, job) => {
  const to = list(env.INTAKE_NOTIFY_EMAILS);
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || to.length === 0)
    return skipped('email not configured');
  const lead = await loadLead(env, job);
  if (!lead) return { outcome: 'failed', reason: 'lead not found' };
  const t = mailText(mailLang(env.INTAKE_LANGUAGE));
  const source = lead.source as Source;
  const text = [
    t.emails.intakeIntro,
    '',
    `${t.emails.name}: ${lead.name}`,
    `${t.emails.phone}: ${lead.phone}`,
    `${t.emails.caseType}: ${t.caseType(lead.caseType)}`,
    `${t.emails.preferredContact}: ${t.contact(lead.preferredContact)}`,
    `${t.emails.campaign}: ${source.utm_campaign ?? t.emails.notSet}`,
    '',
    t.emails.intakeLink,
    adminLink(env, lead),
  ].join('\n');
  await sendEmail(env, job.id, {
    to,
    subject: t.fill(t.emails.intakeSubject, { caseType: t.caseType(lead.caseType) }),
    text,
  });
  return { outcome: 'done' };
};

/** WhatsApp only allows business-started messages through an approved template. No message body is sent. */
const intakeWhatsapp: Handler = async (env, job) => {
  const to = list(env.INTAKE_WHATSAPP_TO);
  if (
    !env.WHATSAPP_TOKEN ||
    !env.WHATSAPP_PHONE_NUMBER_ID ||
    !env.WHATSAPP_INTAKE_TEMPLATE ||
    to.length === 0
  ) {
    return skipped('whatsapp not configured');
  }
  const lead = await loadLead(env, job);
  if (!lead) return { outcome: 'failed', reason: 'lead not found' };
  const t = mailText(mailLang(env.INTAKE_LANGUAGE));
  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION ?? 'v21.0'}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  for (const number of to) {
    await send('whatsapp', url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: number.replace(/^\+/, ''),
        type: 'template',
        template: {
          name: env.WHATSAPP_INTAKE_TEMPLATE,
          language: { code: env.WHATSAPP_TEMPLATE_LANGUAGE ?? 'ar' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: t.caseType(lead.caseType) },
                { type: 'text', text: adminLink(env, lead) },
              ],
            },
          ],
        },
      }),
    });
  }
  return { outcome: 'done' };
};

const clientEmail: Handler = async (env, job) => {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return skipped('email not configured');
  const lead = await loadLead(env, job);
  if (!lead) return { outcome: 'failed', reason: 'lead not found' };
  if (!lead.email) return skipped('lead has no email');
  const t = mailText(mailLang(lead.language));
  await sendEmail(env, job.id, {
    to: [lead.email],
    subject: t.emails.clientSubject,
    text: t.fill(t.emails.clientBody, { name: lead.name, firm: t.firm }),
  });
  return { outcome: 'done' };
};

/** Server-side backup of the browser's generate_lead event. Carries no PII. */
const ga4Lead: Handler = async (env, job) => {
  if (!env.GA4_MEASUREMENT_ID || !env.GA4_API_SECRET) return skipped('ga4 not configured');
  const lead = await loadLead(env, job);
  if (!lead) return { outcome: 'failed', reason: 'lead not found' };
  const params = new URLSearchParams({
    measurement_id: env.GA4_MEASUREMENT_ID,
    api_secret: env.GA4_API_SECRET,
  });
  await send('ga4', `https://www.google-analytics.com/mp/collect?${params}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      // No GA cookie is available server-side; the lead id keeps the event countable without PII.
      client_id: `lead.${lead.id}`,
      events: [
        {
          name: 'generate_lead',
          params: {
            lead_id: lead.id,
            case_type: lead.caseType,
            form_location: (lead.source as Source).landingPage ?? 'unknown',
            language: lead.language,
            source: 'server',
          },
        },
      ],
    }),
  });
  return { outcome: 'done' };
};

/** `yyyy-mm-dd hh:mm:ss+03:00`, the format Google Ads expects, in Riyadh time. */
export function adsDateTime(date: Date) {
  const riyadh = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return `${riyadh.toISOString().slice(0, 19).replace('T', ' ')}+03:00`;
}

async function recordUpload(
  env: JobsEnv,
  leadId: string,
  entry: { action: string; ok: boolean; error?: string },
) {
  const value = JSON.stringify({ ...entry, at: new Date().toISOString() });
  await createDb(env.DB)
    .update(leads)
    .set({
      conversionsUploaded: sql`json_insert(${leads.conversionsUploaded}, '$[#]', json(${value}))`,
    })
    .where(eq(leads.id, leadId));
}

/** Google Ads offline conversion upload when staff mark a lead qualified or retained (AGENTS.md section 6). */
const adsConversion: Handler = async (env, job) => {
  const action = job.payload.action === 'retained' ? 'retained' : 'qualified';
  const actionId =
    action === 'retained'
      ? env.GOOGLE_ADS_CONVERSION_ACTION_RETAINED
      : env.GOOGLE_ADS_CONVERSION_ACTION_QUALIFIED;
  if (
    !env.GOOGLE_ADS_DEVELOPER_TOKEN ||
    !env.GOOGLE_ADS_CLIENT_ID ||
    !env.GOOGLE_ADS_CLIENT_SECRET ||
    !env.GOOGLE_ADS_REFRESH_TOKEN ||
    !env.GOOGLE_ADS_CUSTOMER_ID ||
    !actionId
  ) {
    return skipped('google ads not configured');
  }
  const lead = await loadLead(env, job);
  if (!lead) return { outcome: 'failed', reason: 'lead not found' };
  const source = lead.source as Source;
  const click = source.gclid
    ? { gclid: source.gclid }
    : source.gbraid
      ? { gbraid: source.gbraid }
      : source.wbraid
        ? { wbraid: source.wbraid }
        : null;
  if (!click) return skipped('lead has no click id');

  const token = await send('google oauth', 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: env.GOOGLE_ADS_CLIENT_ID,
      client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
    }),
  }).then(async (res) => ((await res.json()) as { access_token: string }).access_token);

  const customer = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const at = typeof job.payload.at === 'string' ? new Date(job.payload.at) : job.createdAt;
  const res = await send(
    'google ads',
    `https://googleads.googleapis.com/${env.GOOGLE_ADS_API_VERSION ?? 'v21'}/customers/${customer}:uploadClickConversions`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
        'content-type': 'application/json',
        ...(env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
          ? { 'login-customer-id': env.GOOGLE_ADS_LOGIN_CUSTOMER_ID.replace(/-/g, '') }
          : {}),
      },
      body: JSON.stringify({
        conversions: [
          {
            ...click,
            conversionAction: `customers/${customer}/conversionActions/${actionId}`,
            conversionDateTime: adsDateTime(at),
            ...(lead.value ? { conversionValue: lead.value, currencyCode: 'SAR' } : {}),
          },
        ],
        partialFailure: true,
      }),
    },
  );
  const body = (await res.json()) as { partialFailureError?: { message?: string } };
  if (body.partialFailureError) {
    // For example an expired or foreign click id: the same request would fail again.
    const reason = (body.partialFailureError.message ?? 'rejected').slice(0, 300);
    await recordUpload(env, lead.id, { action, ok: false, error: reason });
    return { outcome: 'failed', reason };
  }
  await recordUpload(env, lead.id, { action, ok: true });
  return { outcome: 'done' };
};

export const handlers: Record<JobRow['type'], Handler> = {
  intake_email: intakeEmail,
  intake_whatsapp: intakeWhatsapp,
  client_email: clientEmail,
  ga4_lead: ga4Lead,
  ads_conversion: adsConversion,
};
