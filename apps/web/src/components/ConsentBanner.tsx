'use client';

import { useEffect, useState } from 'react';
import { CONSENT_OPEN_EVENT, readConsent, saveConsent, type ConsentChoice } from '@/lib/consent';

type Labels = { title: string; body: string; accept: string; reject: string; privacy: string };

/** Bilingual banner for Consent Mode v2. Both choices are equally easy, as PDPL expects. */
export function ConsentBanner({ labels, privacyHref }: { labels: Labels; privacyHref: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Reading the cookie must wait for the browser; the server never shows the banner.
    const timer = window.setTimeout(() => setOpen(readConsent() === null), 0);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
    };
  }, []);

  if (!open) return null;
  const choose = (choice: ConsentChoice) => {
    saveConsent(choice);
    setOpen(false);
  };

  return (
    <section
      role="dialog"
      aria-labelledby="consent-title"
      className="fixed inset-x-2 bottom-20 z-50 mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-lg md:bottom-4"
    >
      <h2 id="consent-title" className="font-bold text-brand-900">
        {labels.title}
      </h2>
      <p className="mt-1 text-sm text-slate-700">
        {labels.body}{' '}
        <a href={privacyHref} className="underline">
          {labels.privacy}
        </a>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => choose('granted')}
          className="min-h-11 flex-1 rounded-lg bg-brand-900 px-4 text-sm font-medium text-white"
        >
          {labels.accept}
        </button>
        <button
          type="button"
          onClick={() => choose('denied')}
          className="min-h-11 flex-1 rounded-lg border border-brand-900 px-4 text-sm font-medium text-brand-900"
        >
          {labels.reject}
        </button>
      </div>
    </section>
  );
}

export function ConsentSettingsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))}
      className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
    >
      {label}
    </button>
  );
}
