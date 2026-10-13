import type { ComponentProps, ReactNode } from 'react';

/** Page-width wrapper with the 16px mobile gutter. */
export function Container({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`} {...props} />;
}

export function Section({
  title,
  intro,
  children,
  className = '',
  id,
}: {
  title?: string;
  intro?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-12 sm:py-16 ${className}`}>
      <Container>
        {title && <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">{title}</h2>}
        {intro && <p className="mt-2 max-w-2xl text-slate-600">{intro}</p>}
        <div className={title || intro ? 'mt-8' : ''}>{children}</div>
      </Container>
    </section>
  );
}

export const buttonClass = {
  primary:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-900 px-5 py-3 text-base font-medium text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
  secondary:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-900 px-5 py-3 text-base font-medium text-brand-900 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500',
};

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
      {...props}
    />
  );
}

/** FAQ list that opens and closes without JavaScript. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {items.map((item) => (
        <details key={item.q} className="group px-5 py-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium text-brand-900">
            {item.q}
            <span aria-hidden className="text-xl text-accent-500 transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-2 text-slate-600">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function Steps({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {items.map((item, i) => (
        <li key={item.title} className="rounded-xl bg-brand-50 p-5">
          <span className="flex size-9 items-center justify-center rounded-full bg-brand-900 font-bold text-white">
            {i + 1}
          </span>
          <h3 className="mt-3 font-bold text-brand-900">{item.title}</h3>
          <p className="mt-1 text-slate-600">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function TrustBadges({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <dt className="text-sm text-slate-500">{item.label}</dt>
          <dd className="mt-1 font-bold break-words text-brand-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-3xl space-y-4 leading-relaxed text-slate-700">{children}</div>;
}
