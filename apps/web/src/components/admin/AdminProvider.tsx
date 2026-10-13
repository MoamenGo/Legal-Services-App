'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { AdminBundle, AdminLang, Session } from './types';

export type ApiResult<T> =
  { ok: true; status: number; data: T } | { ok: false; status: number; code: string };

type Ctx = {
  lang: AdminLang;
  setLang: (lang: AdminLang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  messages: AdminBundle[AdminLang];
  session: Session | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<ApiResult<unknown>>;
  signOut: () => Promise<void>;
  api: <T>(path: string, init?: RequestInit) => Promise<ApiResult<T>>;
  /** Fetches a file with the access token and hands it to the browser as a download. */
  download: (path: string, filename: string) => Promise<boolean>;
  formatDate: (iso: string) => string;
};

const AdminContext = createContext<Ctx | null>(null);

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider');
  return ctx;
};

const LANG_KEY = 'admin-lang';
const langListeners = new Set<() => void>();

// The language choice is a per-browser preference; storage can be blocked, so Arabic is the fallback.
const langStore = {
  subscribe(listener: () => void) {
    langListeners.add(listener);
    return () => langListeners.delete(listener);
  },
  get(): AdminLang {
    try {
      return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ar';
    } catch {
      return 'ar';
    }
  },
  set(lang: AdminLang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // Not persisted; nothing else to do.
    }
    langListeners.forEach((listener) => listener());
  },
};

function lookup(tree: unknown, key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      tree,
    );
  return typeof value === 'string' ? value : key;
}

type TokenResponse = { accessToken: string; user: Session };

export function AdminProvider({ bundle, children }: { bundle: AdminBundle; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lang = useSyncExternalStore(langStore.subscribe, langStore.get, () => 'ar' as const);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  // The access token lives only in memory; the httpOnly refresh cookie restores it after a reload.
  const token = useRef<string | null>(null);
  const refreshing = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = useCallback((next: AdminLang) => langStore.set(next), []);

  const accept = useCallback((data: TokenResponse) => {
    token.current = data.accessToken;
    setSession(data.user);
  }, []);

  const refresh = useCallback(() => {
    // One refresh at a time: the server rotates the cookie, so parallel refreshes would race.
    refreshing.current ??= fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    })
      .then(async (res) => {
        if (!res.ok) return false;
        accept((await res.json()) as TokenResponse);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshing.current = null;
      });
    return refreshing.current;
  }, [accept]);

  useEffect(() => {
    void refresh().then((ok) => {
      if (!ok) {
        token.current = null;
        setSession(null);
      }
      setReady(true);
    });
  }, [refresh]);

  const onLogin = pathname === '/admin/login';
  useEffect(() => {
    if (!ready) return;
    if (!session && !onLogin) router.replace('/admin/login');
    if (session && onLogin) router.replace('/admin');
  }, [ready, session, onLogin, router]);

  const raw = useCallback(
    (path: string, init: RequestInit = {}) =>
      fetch(path, {
        ...init,
        credentials: 'same-origin',
        headers: {
          ...(init.body ? { 'content-type': 'application/json' } : {}),
          ...(token.current ? { authorization: `Bearer ${token.current}` } : {}),
          ...init.headers,
        },
      }),
    [],
  );

  const authed = useCallback(
    async (path: string, init?: RequestInit) => {
      let res = await raw(path, init);
      if (res.status === 401 && (await refresh())) res = await raw(path, init);
      if (res.status === 401) {
        token.current = null;
        setSession(null);
      }
      return res;
    },
    [raw, refresh],
  );

  const api = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<ApiResult<T>> => {
      try {
        const res = await authed(path, init);
        if (res.status === 204) return { ok: true, status: 204, data: undefined as T };
        const body = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
        if (!res.ok) return { ok: false, status: res.status, code: body?.error?.code ?? 'error' };
        return { ok: true, status: res.status, data: body as T };
      } catch {
        return { ok: false, status: 0, code: 'network_error' };
      }
    },
    [authed],
  );

  const download = useCallback(
    async (path: string, filename: string) => {
      try {
        const res = await authed(path);
        if (!res.ok) return false;
        const url = URL.createObjectURL(await res.blob());
        const link = Object.assign(document.createElement('a'), { href: url, download: filename });
        link.click();
        URL.revokeObjectURL(url);
        return true;
      } catch {
        return false;
      }
    },
    [authed],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<ApiResult<unknown>> => {
      const result = await api<TokenResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (result.ok) accept(result.data);
      return result;
    },
    [api, accept],
  );

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(
      () => undefined,
    );
    token.current = null;
    setSession(null);
  }, []);

  const value = useMemo<Ctx>(() => {
    const messages = bundle[lang];
    const dateFormat = new Intl.DateTimeFormat(
      lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Riyadh',
      },
    );
    return {
      lang,
      setLang,
      messages,
      t: (key, vars) =>
        lookup(messages.admin, key).replace(/\{(\w+)\}/g, (match, name: string) =>
          vars && name in vars ? String(vars[name]) : match,
        ),
      session,
      ready,
      signIn,
      signOut,
      api,
      download,
      formatDate: (iso) => dateFormat.format(new Date(iso)),
    };
  }, [bundle, lang, setLang, session, ready, signIn, signOut, api, download]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
