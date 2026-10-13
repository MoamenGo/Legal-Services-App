'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAdmin } from './AdminProvider';
import { StatusBadge } from './StatusBadge';
import { leadStatuses, type LeadRow } from './types';
import { inputClass, labelClass, primaryButton, secondaryButton } from './ui';

type ListResponse = { items: LeadRow[]; total: number; page: number; pageSize: number };
const filterKeys = ['status', 'campaign', 'from', 'to', 'q'] as const;

export function LeadsScreen() {
  const { t, api, download, formatDate, session, messages } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters live in the URL so the back button and shared links keep them.
  useEffect(() => {
    let cancelled = false;
    void api<ListResponse>(`/api/admin/leads${query ? `?${query}` : ''}`).then((result) => {
      if (cancelled) return;
      setError(!result.ok);
      if (result.ok) setData(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [api, query]);

  const go = (next: URLSearchParams) => router.push(`${pathname}${next.size ? `?${next}` : ''}`);

  function onFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of filterKeys) {
      const value = String(form.get(key) ?? '').trim();
      if (value) next.set(key, value);
    }
    go(next);
  }

  function toPage(page: number) {
    const next = new URLSearchParams(params);
    next.set('page', String(page));
    go(next);
  }

  async function onExport() {
    setExporting(true);
    const exportQuery = new URLSearchParams(params);
    exportQuery.delete('page');
    const ok = await download(
      `/api/admin/leads/export.csv${exportQuery.size ? `?${exportQuery}` : ''}`,
      `leads-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    setExporting(false);
    setError(!ok);
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const caseType = (key: string) => (messages.form.caseTypes as Record<string, string>)[key] ?? key;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">{t('leads.heading')}</h1>
          {data && (
            <p className="text-sm text-slate-600">{t('leads.total', { count: data.total })}</p>
          )}
        </div>
        {session?.role !== 'lawyer' && (
          <button
            type="button"
            onClick={() => void onExport()}
            disabled={exporting}
            className={secondaryButton}
          >
            {t('leads.export')}
          </button>
        )}
      </div>

      <form
        key={query}
        onSubmit={onFilter}
        className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div className="sm:col-span-2">
          <label htmlFor="q" className={labelClass}>
            {t('leads.search')}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={params.get('q') ?? ''}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>
            {t('leads.status')}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={params.get('status') ?? ''}
            className={`mt-1 ${inputClass}`}
          >
            <option value="">{t('leads.allStatuses')}</option>
            {leadStatuses.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="campaign" className={labelClass}>
            {t('leads.campaign')}
          </label>
          <input
            id="campaign"
            name="campaign"
            dir="ltr"
            defaultValue={params.get('campaign') ?? ''}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="from" className={labelClass}>
            {t('leads.from')}
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={params.get('from') ?? ''}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="to" className={labelClass}>
            {t('leads.to')}
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={params.get('to') ?? ''}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button type="submit" className={primaryButton}>
            {t('leads.apply')}
          </button>
          <button
            type="button"
            onClick={() => go(new URLSearchParams())}
            className={secondaryButton}
          >
            {t('leads.reset')}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">
          {t('errors.generic')}
        </p>
      )}

      {!data ? (
        <p className="py-12 text-center text-slate-500" role="status">
          {t('loading')}
        </p>
      ) : data.items.length === 0 ? (
        <p className="py-12 text-center text-slate-500">{t('leads.empty')}</p>
      ) : (
        <>
          {/* Cards on phones, a table from tablet width up. */}
          <ul className="mt-4 space-y-3 md:hidden">
            {data.items.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/admin/lead?id=${lead.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-brand-900">
                      {lead.name || t('lead.anonymized')}
                    </span>
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600" dir="ltr">
                    {lead.phone}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {caseType(lead.caseType)} · {formatDate(lead.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-start text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {(['date', 'name', 'phone', 'caseType', 'status', 'campaign'] as const).map(
                    (col) => (
                      <th key={col} scope="col" className="px-4 py-3 text-start font-medium">
                        {t(`leads.columns.${col}`)}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/lead?id=${lead.id}`}
                        className="font-medium text-brand-900 underline-offset-2 hover:underline"
                      >
                        {lead.name || t('lead.anonymized')}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" dir="ltr">
                      {lead.phone}
                    </td>
                    <td className="px-4 py-3">{caseType(lead.caseType)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600" dir="ltr">
                      {lead.source.utm_campaign ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <nav
              className="mt-4 flex items-center justify-between gap-2"
              aria-label={t('leads.page', { page: data.page, pages })}
            >
              <button
                type="button"
                disabled={data.page <= 1}
                onClick={() => toPage(data.page - 1)}
                className={secondaryButton}
              >
                {t('leads.previous')}
              </button>
              <span className="text-sm text-slate-600">
                {t('leads.page', { page: data.page, pages })}
              </span>
              <button
                type="button"
                disabled={data.page >= pages}
                onClick={() => toPage(data.page + 1)}
                className={secondaryButton}
              >
                {t('leads.next')}
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
