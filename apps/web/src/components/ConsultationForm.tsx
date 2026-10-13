'use client';

import {
  caseTypes,
  preferredContacts,
  type CaseType,
  type Locale,
  type PreferredContact,
} from '@app/schemas/constants';
import { useRouter } from 'next/navigation';
import { useId, useRef, useState, type ReactNode } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { site } from '@/content/site';
import { collectSource } from '@/lib/attribution';
import { pushEvent } from '@/lib/datalayer';
import { rememberUserData } from '@/lib/enhanced-conversions';
import { loadTurnstile } from '@/lib/turnstile';
import type { FormInput, FormOutput } from './consultation-form-schema';

// zod is most of this form's weight, so it loads on the first interaction, not with the page.
const lazyResolver: Resolver<FormInput, unknown, FormOutput> = async (...args) => {
  const { formResolver } = await import('./consultation-form-schema');
  return formResolver(...args);
};

type FieldName = 'name' | 'phone' | 'email' | 'caseType' | 'message' | 'privacyAccepted';

/** Strings rendered on the server, so the browser needs no message catalog or formatter. */
export type ConsultationFormLabels = {
  name: string;
  phone: string;
  phoneHint: string;
  caseType: string;
  caseTypePlaceholder: string;
  caseTypes: Record<CaseType, string>;
  message: string;
  email: string;
  preferredContact: string;
  preferredContacts: Record<PreferredContact, string>;
  privacy: ReactNode;
  marketing: string;
  website: string;
  submit: string;
  submitting: string;
  verifying: string;
  errors: Record<FieldName | 'captcha' | 'rateLimited' | 'generic', string>;
};

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const inputClass =
  'block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-700 focus:outline-2 focus:outline-brand-700 aria-invalid:border-red-600';

type Props = {
  locale: Locale;
  labels: ConsultationFormLabels;
  /** Where the form sits, for analytics (`form_location`). */
  location: string;
  defaultCaseType?: CaseType;
  /** The short form (landing pages) asks only name, phone, case type and message. */
  variant?: 'short' | 'full';
};

export function ConsultationForm({
  locale,
  labels,
  location,
  defaultCaseType,
  variant = 'full',
}: Props) {
  const router = useRouter();
  const id = useId();
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const started = useRef(false);
  const [token, setToken] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: lazyResolver,
    defaultValues: { caseType: defaultCaseType, preferredContact: 'call', marketingConsent: false },
  });

  const onFirstInteraction = () => {
    if (started.current) return;
    started.current = true;
    pushEvent({ event: 'form_start', form_location: location });
    void import('./consultation-form-schema');
    loadTurnstile()
      .then((turnstile) => {
        if (!widgetRef.current) return;
        widgetId.current = turnstile.render(widgetRef.current, {
          sitekey: site.turnstileSiteKey,
          language: locale,
          size: 'flexible',
          callback: setToken,
          'expired-callback': () => setToken(null),
          'error-callback': () => setToken(null),
        });
      })
      .catch(() => setServerError(labels.errors.captcha));
  };

  const onSubmit = async (values: FormOutput) => {
    setServerError(null);
    if (!token) {
      onFirstInteraction();
      setServerError(labels.verifying);
      return;
    }
    const honeypot = (document.getElementById(`${id}-website`) as HTMLInputElement | null)?.value;
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...values,
        language: locale,
        source: collectSource(),
        turnstileToken: token,
        website: honeypot || undefined,
      }),
    }).catch(() => null);

    if (res?.status === 201) {
      const { id: leadId } = (await res.json()) as { id: string };
      await rememberUserData(values.email, values.phone);
      const query = new URLSearchParams({ lead: leadId, case: values.caseType, from: location });
      router.push(`/${locale}/thank-you?${query}`);
      return;
    }
    // A token is single-use, so get a fresh one for the next attempt.
    setToken(null);
    window.turnstile?.reset(widgetId.current);
    const code = res
      ? ((await res.json().catch(() => null)) as { error?: { code?: string } } | null)?.error?.code
      : undefined;
    setServerError(
      code === 'rate_limited'
        ? labels.errors.rateLimited
        : code === 'captcha_failed'
          ? labels.errors.captcha
          : labels.errors.generic,
    );
  };

  const field = (name: FieldName) => ({
    id: `${id}-${name}`,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${id}-${name}-error` : undefined,
  });
  const fieldError = (name: FieldName) =>
    errors[name] && (
      <p id={`${id}-${name}-error`} className="mt-1 text-sm text-red-700">
        {labels.errors[name]}
      </p>
    );

  return (
    <form
      noValidate
      onSubmit={(event) => handleSubmit(onSubmit)(event)}
      onFocusCapture={onFirstInteraction}
      className="space-y-4"
    >
      <div>
        <label htmlFor={`${id}-name`} className="mb-1 block font-medium">
          {labels.name}
        </label>
        <input
          {...register('name')}
          {...field('name')}
          autoComplete="name"
          className={inputClass}
        />
        {fieldError('name')}
      </div>

      <div>
        <label htmlFor={`${id}-phone`} className="mb-1 block font-medium">
          {labels.phone}
        </label>
        <input
          {...register('phone')}
          {...field('phone')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          placeholder={labels.phoneHint}
          className={`${inputClass} text-start rtl:text-end`}
        />
        {fieldError('phone')}
      </div>

      <div>
        <label htmlFor={`${id}-caseType`} className="mb-1 block font-medium">
          {labels.caseType}
        </label>
        <select
          {...register('caseType')}
          {...field('caseType')}
          defaultValue={defaultCaseType ?? ''}
          className={inputClass}
        >
          <option value="" disabled>
            {labels.caseTypePlaceholder}
          </option>
          {caseTypes.map((type) => (
            <option key={type} value={type}>
              {labels.caseTypes[type]}
            </option>
          ))}
        </select>
        {fieldError('caseType')}
      </div>

      {variant === 'full' && (
        <>
          <div>
            <label htmlFor={`${id}-email`} className="mb-1 block font-medium">
              {labels.email}
            </label>
            <input
              {...register('email', { setValueAs: emptyToUndefined })}
              {...field('email')}
              type="email"
              autoComplete="email"
              dir="ltr"
              className={`${inputClass} text-start rtl:text-end`}
            />
            {fieldError('email')}
          </div>
          <fieldset>
            <legend className="mb-1 font-medium">{labels.preferredContact}</legend>
            <div className="flex flex-wrap gap-2">
              {preferredContacts.map((method) => (
                <label
                  key={method}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 has-checked:border-brand-700 has-checked:bg-brand-50"
                >
                  <input
                    type="radio"
                    value={method}
                    {...register('preferredContact')}
                    className="size-4"
                  />
                  {labels.preferredContacts[method]}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <div>
        <label htmlFor={`${id}-message`} className="mb-1 block font-medium">
          {labels.message}
        </label>
        <textarea
          {...register('message', { setValueAs: emptyToUndefined })}
          {...field('message')}
          rows={variant === 'short' ? 2 : 4}
          className={inputClass}
        />
        {fieldError('message')}
      </div>

      {/* Honeypot: hidden from people and screen readers, left empty by real visitors. */}
      <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>{labels.website}</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label className="flex min-h-11 items-start gap-3">
          <input
            type="checkbox"
            {...register('privacyAccepted')}
            {...field('privacyAccepted')}
            className="mt-1 size-5 shrink-0"
          />
          <span>{labels.privacy}</span>
        </label>
        {fieldError('privacyAccepted')}
      </div>

      {variant === 'full' && (
        <label className="flex min-h-11 items-start gap-3 text-slate-600">
          <input
            type="checkbox"
            {...register('marketingConsent')}
            className="mt-1 size-5 shrink-0"
          />
          <span>{labels.marketing}</span>
        </label>
      )}

      <div ref={widgetRef} />

      {serverError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex min-h-12 w-full items-center justify-center rounded-lg bg-brand-900 px-5 py-3 text-base font-bold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {isSubmitting ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
