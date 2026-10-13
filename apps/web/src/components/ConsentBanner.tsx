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
      className="consent-banner fixed inset-x-2 bottom-20 z-50 mx-auto max-w-xl rounded-2xl border border-line border-t-4 border-t-brand-900 bg-white p-4 shadow-[0_16px_40px_-16px_rgb(12_40_36/0.45)] md:bottom-4"
    >
      <h2 id="consent-title" className="font-bold text-brand-900">
        {labels.title}
      </h2>
      <p className="mt-1 text-sm text-ink">
        {labels.body}{' '}
        <a href={privacyHref} className="underline">
          {labels.privacy}
        </a>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => saveConsent('granted')}
          className="min-h-11 flex-1 rounded-full bg-brand-900 px-4 text-sm font-bold text-white"
        >
          {labels.accept}
        </button>
        <button
          type="button"
          onClick={() => saveConsent('denied')}
          className="min-h-11 flex-1 rounded-full border-2 border-brand-900 px-4 text-sm font-bold text-brand-900"
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
