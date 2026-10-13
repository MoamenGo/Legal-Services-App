import type { LeadStatus } from './types';

export const inputClass =
  'block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-brand-700 focus:outline-2 focus:outline-brand-700';
export const labelClass = 'block text-sm font-medium text-slate-700';
export const primaryButton =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-900 px-4 py-2 text-base font-medium text-white hover:bg-brand-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500';
export const secondaryButton =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500';
export const cardClass = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';

export const statusColor: Record<LeadStatus, string> = {
  new: 'bg-sky-100 text-sky-900',
  contacted: 'bg-amber-100 text-amber-900',
  qualified: 'bg-violet-100 text-violet-900',
  consultation_booked: 'bg-indigo-100 text-indigo-900',
  retained: 'bg-emerald-100 text-emerald-900',
  lost: 'bg-slate-200 text-slate-800',
  spam: 'bg-rose-100 text-rose-900',
};
