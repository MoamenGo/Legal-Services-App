'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAdmin } from './AdminProvider';
import { StatusBadge } from './StatusBadge';
import { leadStatuses, type LeadDetail, type LeadStatus, type Role } from './types';
import { cardClass, inputClass, labelClass, primaryButton, secondaryButton } from './ui';

type Assignable = { id: string; name: string; role: Role };
type Patch = {
  status?: LeadStatus;
  assignedTo?: string | null;
  value?: number | null;
  note?: string;
};

const sourceKeys = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gbraid',
  'wbraid',
  'landingPage',
  'referrer',
  'device',
] as const;

export function LeadScreen() {
  const { t, api, session, formatDate, messages } = useAdmin();
  const id = useSearchParams().get('id') ?? '';
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [people, setPeople] = useState<Assignable[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; key: string } | null>(null);
  const canAssign = session?.role !== 'lawyer';

  useEffect(() => {
    let cancelled = false;
    void api<{ lead: LeadDetail }>(`/api/admin/leads/${encodeURIComponent(id)}`).then((result) => {
      if (cancelled) return;
      if (result.ok) setLead(result.data.lead);
      else setMissing(true);
    });
    return () => {
      cancelled = true;
    };
  }, [api, id]);

  useEffect(() => {
    if (!canAssign) return;
    void api<{ users: Assignable[] }>('/api/admin/users/assignable').then((result) => {
      if (result.ok) setPeople(result.data.users);
    });
  }, [api, canAssign]);

  if (missing) {
    return (
      <div className={cardClass}>
        <p>{t('lead.notFound')}</p>
        <Link href="/admin" className={`mt-4 ${secondaryButton}`}>
          {t('lead.back')}
        </Link>
      </div>
    );
  }
  if (!lead) {
    return (
      <p className="py-12 text-center text-slate-500" role="status">
        {t('loading')}
      </p>
    );
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lead) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const patch: Patch = {};
    const status = String(form.get('status')) as LeadStatus;
    if (status !== lead.status) patch.status = status;
    if (canAssign) {
      const assignee = String(form.get('assignedTo') ?? '') || null;
      if (assignee !== lead.assignedTo) patch.assignedTo = assignee;
    }
    const rawValue = String(form.get('value') ?? '').trim();
    const value = rawValue === '' ? null : Number(rawValue);
    if (value !== lead.value && (value === null || Number.isInteger(value))) patch.value = value;
    const note = String(form.get('note') ?? '').trim();
    if (note) patch.note = note;
    if (Object.keys(patch).length === 0) return;

    setSaving(true);
    const result = await api<{ lead: LeadDetail }>(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (result.ok) {
      setLead(result.data.lead);
      formElement.reset();
      setNotice({ ok: true, key: 'lead.saved' });
    } else {
      setNotice({
        ok: false,
        key:
          result.status === 403
            ? 'errors.forbidden'
            : result.status === 400
              ? 'errors.validation'
              : 'errors.generic',
      });
    }
  }

  const label = (group: 'caseTypes' | 'preferredContacts', key: string) =>
    (messages.form[group] as Record<string, string>)[key] ?? key;
  const digits = lead.phone.replace(/\D/g, '');
  const sources = sourceKeys.filter((key) => lead.source[key]);

  return (
    <div className="space-y-4">
      <Link
        href="/admin"
        className="inline-flex min-h-11 items-center text-sm text-brand-700 hover:underline"
      >
        <span aria-hidden className="me-1 inline-block rtl:rotate-180">
          ←
        </span>
        {t('lead.back')}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-brand-900">{lead.name}</h1>
        <StatusBadge status={lead.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className={cardClass}>
            <h2 className="font-bold text-brand-900">{t('lead.contact')}</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Field term={t('lead.phone')}>
                <span dir="ltr">{lead.phone}</span>
              </Field>
              <Field term={t('lead.email')}>
                {lead.email ? <span dir="ltr">{lead.email}</span> : '—'}
              </Field>
              <Field term={t('lead.caseType')}>{label('caseTypes', lead.caseType)}</Field>
              <Field term={t('lead.preferredContact')}>
                {label('preferredContacts', lead.preferredContact)}
              </Field>
              <Field term={t('lead.language')}>
                {lead.language === 'ar' ? 'العربية' : 'English'}
              </Field>
              <Field term={t('lead.createdAt')}>{formatDate(lead.createdAt)}</Field>
              <Field term={t('lead.marketing')}>
                {lead.marketingConsent ? t('lead.yes') : t('lead.no')}
              </Field>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${lead.phone}`} className={secondaryButton}>
                {t('lead.call')}
              </a>
              <a
                href={`https://wa.me/${digits}`}
                target="_blank"
                rel="noopener noreferrer"
                className={secondaryButton}
              >
                {t('lead.whatsapp')}
              </a>
            </div>
            {lead.message && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-600">{t('lead.message')}</h3>
                <p className="mt-1 whitespace-pre-wrap">{lead.message}</p>
              </div>
            )}
          </section>

          <section className={cardClass}>
            <h2 className="font-bold text-brand-900">{t('lead.notes')}</h2>
            {lead.notes.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">{t('lead.noNotes')}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {lead.notes.map((note) => (
                  <li key={note.id} className="border-s-2 border-accent-500 ps-3">
                    <p className="whitespace-pre-wrap">{note.text}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {note.by ?? '—'} · {formatDate(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {lead.jobs.length > 0 && (
            <section className={cardClass}>
              <h2 className="font-bold text-brand-900">{t('lead.jobs')}</h2>
              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {lead.jobs.map((job) => (
                  <li
                    key={`${job.type}-${job.updatedAt}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <span>{t(`jobs.${job.type}`)}</span>
                    <span className={jobColor[job.status]} title={job.lastError ?? undefined}>
                      {t(`jobs.status.${job.status}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sources.length > 0 && (
            <section className={cardClass}>
              <h2 className="font-bold text-brand-900">{t('lead.source')}</h2>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {sources.map((key) => (
                  <Field key={key} term={key}>
                    <span dir="ltr" className="break-all">
                      {lead.source[key]}
                    </span>
                  </Field>
                ))}
              </dl>
            </section>
          )}
        </div>

        <form onSubmit={(event) => void onSave(event)} className={`h-fit space-y-4 ${cardClass}`}>
          <h2 className="font-bold text-brand-900">{t('lead.update')}</h2>
          <div>
            <label htmlFor="status" className={labelClass}>
              {t('leads.status')}
            </label>
            <select
              key={lead.status}
              id="status"
              name="status"
              defaultValue={lead.status}
              className={`mt-1 ${inputClass}`}
            >
              {leadStatuses.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}`)}
                </option>
              ))}
            </select>
          </div>
          {canAssign && (
            <div>
              <label htmlFor="assignedTo" className={labelClass}>
                {t('lead.assignee')}
              </label>
              <select
                key={`${lead.assignedTo}-${people.length}`}
                id="assignedTo"
                name="assignedTo"
                defaultValue={lead.assignedTo ?? ''}
                className={`mt-1 ${inputClass}`}
              >
                <option value="">{t('lead.unassigned')}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({t(`roles.${p.role}`)})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="value" className={labelClass}>
              {t('lead.value')}
            </label>
            <input
              key={lead.value ?? 'none'}
              id="value"
              name="value"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              dir="ltr"
              defaultValue={lead.value ?? ''}
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="note" className={labelClass}>
              {t('lead.note')}
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              maxLength={2000}
              placeholder={t('lead.notePlaceholder')}
              className={`mt-1 ${inputClass}`}
            />
          </div>
          {notice && (
            <p
              role="status"
              className={`rounded-lg p-3 text-sm ${notice.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}
            >
              {t(notice.key)}
            </p>
          )}
          <button type="submit" disabled={saving} className={`w-full ${primaryButton}`}>
            {saving ? t('lead.saving') : t('lead.save')}
          </button>
        </form>
      </div>
    </div>
  );
}

const jobColor = {
  pending: 'text-amber-700',
  done: 'text-emerald-700',
  skipped: 'text-slate-500',
  failed: 'text-rose-700',
} as const;

function Field({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{term}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
