'use client';

import { reopenConsent, saveConsent } from '@/lib/consent';

type Labels = { title: string; body: string; accept: string; reject: string; privacy: string };

/**
 * Bilingual banner for Consent Mode v2. Both choices are equally easy, as PDPL expects.
 * It is in the prerendered HTML and shown by CSS while `<html data-consent="ask">` (set by the
 * inline consent script), so it paints with the page rather than after the JavaScript loads.
 */
export function ConsentBanner({ labels, privacyHref }: { labels: Labels; privacyHref: string }) {
  return (
    <section
      role="dialog"
      aria-labelledby="consent-title"
      className="consent-banner fixed inset-x-2 bottom-20 z-50 mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-lg md:bottom-4"
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
          onClick={() => saveConsent('granted')}
          className="min-h-11 flex-1 rounded-lg bg-brand-900 px-4 text-sm font-medium text-white"
        >
          {labels.accept}
        </button>
        <button
          type="button"
          onClick={() => saveConsent('denied')}
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
      onClick={reopenConsent}
      className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
    >
      {label}
    </button>
  );
}
