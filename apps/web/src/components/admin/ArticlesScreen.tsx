'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAdmin } from './AdminProvider';
import { PublishButton } from './PublishButton';
import { secondaryButton } from './ui';

type Row = {
  id: string;
  slug: string;
  title: { ar: string; en?: string };
  published: boolean;
  updatedAt: string;
  author: string | null;
};

export function ArticlesScreen() {
  const { t, api, session, formatDate, lang } = useAdmin();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState(false);
  const canEdit = session?.role !== 'lawyer';

  useEffect(() => {
    let cancelled = false;
    void api<{ articles: Row[] }>('/api/admin/articles').then((result) => {
      if (cancelled) return;
      setError(!result.ok);
      if (result.ok) setRows(result.data.articles);
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">{t('articles.heading')}</h1>
          {!canEdit && <p className="text-sm text-slate-600">{t('articles.readOnly')}</p>}
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-start gap-2">
            <Link href="/admin/article" className={secondaryButton}>
              {t('articles.new')}
            </Link>
            <PublishButton />
          </div>
        )}
      </div>
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
        <p className="py-12 text-center text-slate-500">{t('articles.empty')}</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/article?id=${row.id}`}
                className="flex flex-wrap items-center gap-3 p-4 hover:bg-slate-50"
              >
                <span className="min-w-0 flex-1 font-medium text-brand-900">
                  {(lang === 'en' && row.title.en) || row.title.ar}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${row.published ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-800'}`}
                >
                  {row.published ? t('articles.published') : t('articles.draft')}
                </span>
                <span className="text-xs text-slate-500">
                  {t('articles.updated')}: {formatDate(row.updatedAt)}
                  {row.author ? ` · ${row.author}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
