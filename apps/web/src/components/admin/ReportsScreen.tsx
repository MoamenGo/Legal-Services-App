'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAdmin } from './AdminProvider';
import { inputClass, labelClass, primaryButton } from './ui';

const groups = ['campaign', 'term', 'landingPage'] as const;
const stages = ['leads', 'contacted', 'qualified', 'booked', 'retained', 'spam'] as const;
type Row = Record<(typeof stages)[number] | 'value', number> & { key: string | null };

export function ReportsScreen() {
  const { t, api } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api<{ rows: Row[] }>(`/api/admin/reports/funnel${query ? `?${query}` : ''}`).then(
      (result) => {
        if (cancelled) return;
        setError(!result.ok);
        if (result.ok) setRows(result.data.rows);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, query]);

  function onFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const key of ['groupBy', 'from', 'to']) {
      const value = String(form.get(key) ?? '');
      if (value) next.set(key, value);
    }
    router.push(`${pathname}?${next}`);
  }

  const total = rows?.reduce(
    (sum, row) => {
      for (const key of [...stages, 'value'] as const) sum[key] += row[key];
      return sum;
    },
    { leads: 0, contacted: 0, qualified: 0, booked: 0, retained: 0, spam: 0, value: 0 },
  );
  const rate = (row: { leads: number; retained: number; spam: number }) => {
    const real = row.leads - row.spam;
    return real > 0 ? `${Math.round((row.retained / real) * 100)}%` : '—';
  };
  const number = new Intl.NumberFormat('en-US');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">{t('reports.heading')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">{t('reports.intro')}</p>
      </div>
      <form
        key={query}
        onSubmit={onFilter}
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
      >
        <div>
          <label htmlFor="groupBy" className={labelClass}>
            {t('reports.groupBy')}
          </label>
          <select
            id="groupBy"
            name="groupBy"
            defaultValue={params.get('groupBy') ?? 'campaign'}
            className={`mt-1 ${inputClass}`}
          >
            {groups.map((g) => (
              <option key={g} value={g}>
                {t(`reports.groups.${g}`)}
              </option>
            ))}
          </select>
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
        <div className="flex items-end">
          <button type="submit" className={`w-full ${primaryButton}`}>
            {t('leads.apply')}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-900">
          {t('errors.generic')}
        </p>
      )}
      {!rows ? (
        <p role="status" className="py-12 text-center text-slate-500">
          {t('loading')}
        </p>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-slate-500">{t('reports.empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3 text-start font-medium">
                  {t(`reports.groups.${params.get('groupBy') ?? 'campaign'}`)}
                </th>
                {[...stages, 'rate', 'value'].map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-3 text-end font-medium whitespace-nowrap"
                  >
                    {t(`reports.columns.${col}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...rows, ...(total ? [{ ...total, key: '__total' }] : [])].map((row) => (
                <tr
                  key={row.key ?? '__none'}
                  className={row.key === '__total' ? 'bg-slate-50 font-bold' : ''}
                >
                  <th
                    scope="row"
                    className="max-w-xs truncate px-4 py-3 text-start font-medium"
                    dir="auto"
                  >
                    {row.key === '__total' ? t('reports.total') : (row.key ?? t('reports.none'))}
                  </th>
                  {stages.map((stage) => (
                    <td key={stage} className="px-4 py-3 text-end tabular-nums">
                      {number.format(row[stage])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-end tabular-nums">{rate(row)}</td>
                  <td className="px-4 py-3 text-end tabular-nums">{number.format(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
