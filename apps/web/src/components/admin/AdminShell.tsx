'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useAdmin } from './AdminProvider';

export function AdminShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang, session, ready, signOut } = useAdmin();
  const pathname = usePathname();
  const onLogin = pathname === '/admin/login';

  const nav = [
    {
      href: '/admin',
      label: t('nav.leads'),
      active: pathname === '/admin' || pathname === '/admin/lead',
    },
    ...(session && session.role !== 'lawyer'
      ? [{ href: '/admin/reports', label: t('nav.reports'), active: pathname === '/admin/reports' }]
      : []),
    ...(session?.role === 'admin'
      ? [{ href: '/admin/users', label: t('nav.users'), active: pathname === '/admin/users' }]
      : []),
  ];

  return (
    <div className="min-h-dvh bg-slate-50">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:rounded focus:bg-white focus:p-2"
      >
        {t('nav.skipToContent')}
      </a>
      <header className="border-b border-slate-200 bg-brand-900 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <span className="font-bold">{t('title')}</span>
          {session && (
            <nav className="flex gap-1" aria-label={t('title')}>
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.active ? 'page' : undefined}
                  className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm ${item.active ? 'bg-white/15 font-medium' : 'hover:bg-white/10'}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
          <div className="ms-auto flex items-center gap-2">
            {session && (
              <span className="hidden text-sm text-white/80 sm:inline">{session.name}</span>
            )}
            <button
              type="button"
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              lang={lang === 'ar' ? 'en' : 'ar'}
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm hover:bg-white/10"
            >
              {t('nav.language')}
            </button>
            {session && (
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex min-h-11 items-center rounded-md px-3 text-sm hover:bg-white/10"
              >
                {t('nav.logout')}
              </button>
            )}
          </div>
        </div>
      </header>
      <main id="admin-main" className="mx-auto max-w-6xl px-4 py-6">
        {/* Nothing renders until the session check settles, so protected screens never flash. */}
        {!ready || (!session && !onLogin) || (session && onLogin) ? (
          <p className="py-12 text-center text-slate-500" role="status">
            {t('loading')}
          </p>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
