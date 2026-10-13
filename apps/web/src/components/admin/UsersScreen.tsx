'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useAdmin } from './AdminProvider';
import type { AdminUser, Role } from './types';
import { cardClass, inputClass, labelClass, primaryButton, secondaryButton } from './ui';

const roles: Role[] = ['intake', 'lawyer', 'admin'];

const errorKey = (code: string, status: number) =>
  code === 'email_taken'
    ? 'users.emailTaken'
    : code === 'cannot_change_self'
      ? 'users.cannotChangeSelf'
      : status === 400
        ? 'errors.validation'
        : status === 403
          ? 'errors.forbidden'
          : 'errors.generic';

export function UsersScreen() {
  const { t, api, session, formatDate } = useAdmin();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; key: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Bumped after every change so the list reloads.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void api<{ users: AdminUser[] }>('/api/admin/users').then((result) => {
      if (cancelled) return;
      if (result.ok) setUsers(result.data.users);
      else setNotice({ ok: false, key: errorKey(result.code, result.status) });
    });
    return () => {
      cancelled = true;
    };
  }, [api, version]);

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    const result = await api('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        name: String(form.get('name') ?? '').trim(),
        email: String(form.get('email') ?? '').trim(),
        role: form.get('role'),
        password: String(form.get('password') ?? ''),
      }),
    });
    setBusy(false);
    if (result.ok) {
      formElement.reset();
      setNotice({ ok: true, key: 'users.created' });
      setVersion((v) => v + 1);
    } else {
      setNotice({ ok: false, key: errorKey(result.code, result.status) });
    }
  }

  async function update(
    id: string,
    patch: Partial<{ role: Role; active: boolean; password: string }>,
  ) {
    const result = await api(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setNotice(
      result.ok
        ? { ok: true, key: 'users.updated' }
        : { ok: false, key: errorKey(result.code, result.status) },
    );
    if (result.ok) setVersion((v) => v + 1);
  }

  function onPassword(id: string) {
    const password = window.prompt(`${t('users.newPassword')} (${t('users.passwordHint')})`);
    if (password) void update(id, { password });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-brand-900">{t('users.heading')}</h1>

      {notice && (
        <p
          role="status"
          className={`rounded-lg p-3 text-sm ${notice.ok ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}
        >
          {t(notice.key)}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={`lg:col-span-2 ${cardClass}`}>
          {!users ? (
            <p role="status" className="text-slate-500">
              {t('loading')}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((user) => (
                <li key={user.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-900">
                      {user.name}{' '}
                      {!user.active && (
                        <span className="text-xs text-rose-700">({t('users.inactive')})</span>
                      )}
                    </p>
                    <p className="truncate text-sm text-slate-600" dir="ltr">
                      {user.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t('users.lastLogin')}:{' '}
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : t('users.never')}
                    </p>
                  </div>
                  <label className="sr-only" htmlFor={`role-${user.id}`}>
                    {t('users.role')}
                  </label>
                  <select
                    id={`role-${user.id}`}
                    value={user.role}
                    disabled={user.id === session?.id}
                    onChange={(event) => void update(user.id, { role: event.target.value as Role })}
                    className={`w-auto ${inputClass}`}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {t(`roles.${role}`)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onPassword(user.id)}
                    className={secondaryButton}
                  >
                    {t('users.resetPassword')}
                  </button>
                  {user.id !== session?.id && (
                    <button
                      type="button"
                      onClick={() => void update(user.id, { active: !user.active })}
                      className={secondaryButton}
                    >
                      {user.active ? t('users.deactivate') : t('users.activate')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={(event) => void onCreate(event)} className={`h-fit space-y-4 ${cardClass}`}>
          <h2 className="font-bold text-brand-900">{t('users.add')}</h2>
          <div>
            <label htmlFor="new-name" className={labelClass}>
              {t('users.name')}
            </label>
            <input
              id="new-name"
              name="name"
              required
              minLength={2}
              maxLength={100}
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="new-email" className={labelClass}>
              {t('users.email')}
            </label>
            <input
              id="new-email"
              name="email"
              type="email"
              dir="ltr"
              required
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="new-role" className={labelClass}>
              {t('users.role')}
            </label>
            <select
              id="new-role"
              name="role"
              defaultValue="intake"
              className={`mt-1 ${inputClass}`}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {t(`roles.${role}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="new-password" className={labelClass}>
              {t('users.password')}
            </label>
            <input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              dir="ltr"
              required
              minLength={12}
              aria-describedby="new-password-hint"
              className={`mt-1 ${inputClass}`}
            />
            <p id="new-password-hint" className="mt-1 text-xs text-slate-500">
              {t('users.passwordHint')}
            </p>
          </div>
          <button type="submit" disabled={busy} className={`w-full ${primaryButton}`}>
            {t('users.create')}
          </button>
        </form>
      </div>
    </div>
  );
}
