'use client';

import { useState, type FormEvent } from 'react';
import { useAdmin } from './AdminProvider';
import { cardClass, inputClass, labelClass, primaryButton } from './ui';

const errorKeys: Record<string, string> = {
  invalid_credentials: 'login.invalid',
  account_locked: 'login.locked',
  rate_limited: 'login.rateLimited',
  auth_not_configured: 'login.notConfigured',
  validation_error: 'login.invalid',
};

export function LoginScreen() {
  const { t, signIn } = useAdmin();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const result = await signIn(
      String(form.get('email') ?? ''),
      String(form.get('password') ?? ''),
    );
    setBusy(false);
    if (!result.ok) setError(errorKeys[result.code] ?? 'errors.generic');
  }

  return (
    <div className={`mx-auto mt-8 max-w-sm ${cardClass}`}>
      <h1 className="text-2xl font-bold text-brand-900">{t('login.heading')}</h1>
      <p className="mt-1 text-sm text-slate-600">{t('login.intro')}</p>
      <form onSubmit={(event) => void onSubmit(event)} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className={labelClass}>
            {t('login.email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            dir="ltr"
            required
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>
            {t('login.password')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            dir="ltr"
            required
            className={`mt-1 ${inputClass}`}
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-900">
            {t(error)}
          </p>
        )}
        <button type="submit" disabled={busy} className={`w-full ${primaryButton}`}>
          {busy ? t('login.submitting') : t('login.submit')}
        </button>
      </form>
    </div>
  );
}
