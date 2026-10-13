'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAdmin } from './AdminProvider';
import { PublishButton } from './PublishButton';
import { cardClass, inputClass, labelClass, primaryButton, secondaryButton } from './ui';

type Localized = { ar: string; en?: string };
type Article = {
  id: string;
  slug: string;
  title: Localized;
  summary: Localized;
  body: Localized;
  tags: string[];
  published: boolean;
};

const empty: Omit<Article, 'id'> = {
  slug: '',
  title: { ar: '' },
  summary: { ar: '' },
  body: { ar: '' },
  tags: [],
  published: false,
};

export function ArticleEditor() {
  const { t, api, session } = useAdmin();
  const router = useRouter();
  const id = useSearchParams().get('id');
  const [article, setArticle] = useState<Omit<Article, 'id'> | null>(id ? null : empty);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; key: string } | null>(null);
  const readOnly = session?.role === 'lawyer';

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void api<{ article: Article }>(`/api/admin/articles/${encodeURIComponent(id)}`).then(
      (result) => {
        if (cancelled) return;
        if (result.ok) setArticle(result.data.article);
        else setMissing(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [api, id]);

  if (missing) return <p className={cardClass}>{t('article.notFound')}</p>;
  if (!article) {
    return (
      <p role="status" className="py-12 text-center text-slate-500">
        {t('loading')}
      </p>
    );
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? '').trim();
    const payload = {
      slug: text('slug'),
      title: { ar: text('title_ar'), en: text('title_en') },
      summary: { ar: text('summary_ar'), en: text('summary_en') },
      body: { ar: text('body_ar'), en: text('body_en') },
      tags: text('tags')
        .split(/[,،]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      published: form.get('published') === 'on',
    };
    setSaving(true);
    const result = await api<{ article: Article }>(
      id ? `/api/admin/articles/${id}` : '/api/admin/articles',
      {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (result.ok) {
      setArticle(result.data.article);
      setNotice({ ok: true, key: 'article.saved' });
      if (!id) router.replace(`/admin/article?id=${result.data.article.id}`);
    } else {
      setNotice({
        ok: false,
        key:
          result.code === 'slug_taken'
            ? 'article.slugTaken'
            : result.status === 400
              ? 'errors.validation'
              : 'errors.generic',
      });
    }
  }

  async function onDelete() {
    if (!id || !window.confirm(t('article.confirmDelete'))) return;
    const result = await api(`/api/admin/articles/${id}`, { method: 'DELETE' });
    if (result.ok) router.push('/admin/articles');
    else
      setNotice({ ok: false, key: result.status === 403 ? 'errors.forbidden' : 'errors.generic' });
  }

  const field = (
    name: string,
    label: string,
    value: string,
    opts: { rows?: number; dir?: 'rtl' | 'ltr'; max: number; required?: boolean },
  ) => (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      {opts.rows ? (
        <textarea
          id={name}
          name={name}
          rows={opts.rows}
          dir={opts.dir}
          maxLength={opts.max}
          required={opts.required}
          readOnly={readOnly}
          defaultValue={value}
          className={`mt-1 ${inputClass}`}
        />
      ) : (
        <input
          id={name}
          name={name}
          dir={opts.dir}
          maxLength={opts.max}
          required={opts.required}
          readOnly={readOnly}
          defaultValue={value}
          className={`mt-1 ${inputClass}`}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Link
        href="/admin/articles"
        className="inline-flex min-h-11 items-center text-sm text-brand-700 hover:underline"
      >
        <span aria-hidden className="me-1 inline-block rtl:rotate-180">
          ←
        </span>
        {t('article.back')}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-900">
          {id ? t('article.editHeading') : t('article.newHeading')}
        </h1>
        {id && !readOnly && <PublishButton />}
      </div>

      <form key={id ?? 'new'} onSubmit={(event) => void onSave(event)} className="space-y-4">
        <section className={`space-y-4 ${cardClass}`}>
          <div>
            <label htmlFor="slug" className={labelClass}>
              {t('article.slug')}
            </label>
            <input
              id="slug"
              name="slug"
              dir="ltr"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={80}
              readOnly={readOnly}
              defaultValue={article.slug}
              aria-describedby="slug-hint"
              className={`mt-1 ${inputClass}`}
            />
            <p id="slug-hint" className="mt-1 text-xs text-slate-500">
              {t('article.slugHint')}
            </p>
          </div>
          <div>
            <label htmlFor="tags" className={labelClass}>
              {t('article.tags')}
            </label>
            <input
              id="tags"
              name="tags"
              readOnly={readOnly}
              defaultValue={article.tags.join('، ')}
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              name="published"
              defaultChecked={article.published}
              disabled={readOnly}
              className="size-5"
            />
            {t('article.publishedLabel')}
          </label>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className={`space-y-4 ${cardClass}`} lang="ar" dir="rtl">
            <h2 className="font-bold text-brand-900">{t('article.arabic')}</h2>
            {field('title_ar', t('article.title'), article.title.ar, { max: 160, required: true })}
            {field('summary_ar', t('article.summary'), article.summary.ar, {
              max: 300,
              rows: 2,
              required: true,
            })}
            {field('body_ar', t('article.body'), article.body.ar, {
              max: 20000,
              rows: 16,
              required: true,
            })}
          </section>
          <section className={`space-y-4 ${cardClass}`} lang="en" dir="ltr">
            <h2 className="font-bold text-brand-900">{t('article.english')}</h2>
            <p className="text-xs text-slate-500">{t('article.englishHint')}</p>
            {field('title_en', t('article.title'), article.title.en ?? '', { max: 160 })}
            {field('summary_en', t('article.summary'), article.summary.en ?? '', {
              max: 300,
              rows: 2,
            })}
            {field('body_en', t('article.body'), article.body.en ?? '', { max: 20000, rows: 16 })}
          </section>
        </div>
        <p className="text-sm text-slate-600">{t('article.bodyHint')}</p>

        {notice && (
          <p
            role="status"
            className={`rounded-lg p-3 text-sm ${notice.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}
          >
            {t(notice.key)}
          </p>
        )}
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? t('article.saving') : t('article.save')}
            </button>
            {id && session?.role === 'admin' && (
              <button
                type="button"
                onClick={() => void onDelete()}
                className={`${secondaryButton} text-rose-800`}
              >
                {t('article.delete')}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
