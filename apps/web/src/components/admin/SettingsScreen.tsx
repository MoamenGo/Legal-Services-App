'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useAdmin } from './AdminProvider';
import { PublishButton } from './PublishButton';
import { cardClass, inputClass, labelClass, primaryButton } from './ui';

type Settings = Record<
  'phone' | 'whatsapp' | 'email' | 'address_ar' | 'address_en' | 'hours_ar' | 'hours_en',
  string | null
>;

const fields: {
  key: keyof Settings;
  label: string;
  dir?: 'ltr' | 'rtl';
  type?: string;
  hint?: string;
}[] = [
  { key: 'phone', label: 'settings.phone', dir: 'ltr', type: 'tel', hint: 'settings.phoneHint' },
  {
    key: 'whatsapp',
    label: 'settings.whatsapp',
    dir: 'ltr',
    type: 'tel',
    hint: 'settings.phoneHint',
  },
  { key: 'email', label: 'settings.email', dir: 'ltr', type: 'email' },
  { key: 'address_ar', label: 'settings.addressAr', dir: 'rtl' },
  { key: 'address_en', label: 'settings.addressEn', dir: 'ltr' },
  { key: 'hours_ar', label: 'settings.hoursAr', dir: 'rtl' },
  { key: 'hours_en', label: 'settings.hoursEn', dir: 'ltr' },
];

export function SettingsScreen() {
  const { t, api } = useAdmin();
  const [values, setValues] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; key: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api<{ settings: Settings }>('/api/admin/settings').then((result) => {
      if (cancelled) return;
      if (result.ok) setValues(result.data.settings);
      else
        setNotice({
          ok: false,
          key: result.status === 403 ? 'errors.forbidden' : 'errors.generic',
        });
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(fields.map(({ key }) => [key, String(form.get(key) ?? '')]));
    setSaving(true);
    const result = await api<{ settings: Settings }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (result.ok) setValues(result.data.settings);
    setNotice(
      result.ok
        ? { ok: true, key: 'settings.saved' }
        : { ok: false, key: result.status === 400 ? 'errors.validation' : 'errors.generic' },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">{t('settings.heading')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{t('settings.intro')}</p>
        </div>
        <PublishButton />
      </div>
      {!values ? (
        notice ? null : (
          <p role="status" className="py-12 text-center text-slate-500">
            {t('loading')}
          </p>
        )
      ) : (
        <form
          key={JSON.stringify(values)}
          onSubmit={(event) => void onSave(event)}
          className={`max-w-2xl space-y-4 ${cardClass}`}
        >
          {fields.map((f) => (
            <div key={f.key}>
              <label htmlFor={f.key} className={labelClass}>
                {t(f.label)}
              </label>
              <input
                id={f.key}
                name={f.key}
                type={f.type ?? 'text'}
                dir={f.dir}
                defaultValue={values[f.key] ?? ''}
                aria-describedby={f.hint ? `${f.key}-hint` : undefined}
                className={`mt-1 ${inputClass}`}
              />
              {f.hint && (
                <p id={`${f.key}-hint`} className="mt-1 text-xs text-slate-500">
                  {t(f.hint)}
                </p>
              )}
            </div>
          ))}
          <button type="submit" disabled={saving} className={primaryButton}>
            {t('settings.save')}
          </button>
        </form>
      )}
      {notice && (
        <p
          role="status"
          className={`max-w-2xl rounded-lg p-3 text-sm ${notice.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}
        >
          {t(notice.key)}
        </p>
      )}
    </div>
  );
}
