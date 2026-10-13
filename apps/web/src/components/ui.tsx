import type { ComponentProps, ReactNode } from 'react';
import { ArrowIcon } from './icons';
import { Link } from './LocalLink';

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
  tone = 'light',
}: {
  title?: string;
  intro?: string;
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: 'light' | 'gypsum' | 'pine';
}) {
  const tones = { light: '', gypsum: 'bg-gypsum', pine: 'on-pine bg-brand-900 text-white' };
  return (
    <section id={id} className={`py-14 sm:py-20 ${tones[tone]} ${className}`}>
      <Container>
        {title && <SectionTitle onPine={tone === 'pine'}>{title}</SectionTitle>}
        {intro && (
          <p
            className={`mt-3 max-w-2xl text-lg ${tone === 'pine' ? 'text-brand-100' : 'text-muted'}`}
          >
            {intro}
          </p>
        )}
        <div className={title || intro ? 'mt-10' : ''}>{children}</div>
      </Container>
    </section>
  );
}

export function SectionTitle({
  children,
  onPine = false,
}: {
  children: ReactNode;
  onPine?: boolean;
}) {
  return (
    <h2
      className={`font-display text-3xl font-semibold sm:text-4xl ${onPine ? 'text-white' : 'text-brand-900'}`}
    >
      {children}
    </h2>
  );
}

/**
 * The opening block of the main pages: pine, rising out of the header as a parapet, with the
 * consultation form beside the headline on desktop and right under it on a phone.
 */
export function Hero({
  title,
  intro,
  children,
  compact = false,
}: {
  title: string;
  intro: string;
  children: ReactNode;
  /** Landing pages: tighter, so the form starts above the fold at 360px. */
  compact?: boolean;
}) {
  return (
    <div className="najdi-top on-pine bg-brand-900 text-white">
      <Container
        className={`grid gap-6 lg:grid-cols-[minmax(0,1fr)_27rem] lg:items-start lg:gap-14 ${compact ? 'pb-10 pt-4 sm:pt-10 lg:py-14' : 'pb-12 pt-8 sm:pt-12 lg:py-20'}`}
      >
        <div className="lg:pt-6">
          <h1
            className={`font-display font-semibold text-white ${compact ? 'text-[1.75rem] sm:text-5xl' : 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl'}`}
          >
            {title}
          </h1>
          <p
            className={`max-w-xl text-brand-100 ${compact ? 'mt-2 sm:mt-5 sm:text-xl' : 'mt-5 text-lg sm:text-xl'}`}
          >
            {intro}
          </p>
          <div
            aria-hidden
            className="najdi-vents mt-10 hidden max-w-xs text-saffron-400 lg:block"
          />
        </div>
        {children}
      </Container>
    </div>
  );
}

/** Page title for inner pages: the display face, with the intro held to a readable measure. */
export function PageTitle({ title, intro }: { title: string; intro?: string }) {
  return (
    <header className="max-w-3xl">
      <h1 className="font-display text-4xl font-semibold text-brand-900 sm:text-5xl">{title}</h1>
      {intro && <p className="mt-4 text-lg text-muted">{intro}</p>}
    </header>
  );
}

export const buttonClass = {
  primary:
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-900 px-6 py-3 text-base font-bold text-white hover:bg-brand-700',
  secondary:
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-brand-900 px-6 py-3 text-base font-bold text-brand-900 hover:bg-brand-50',
  /** For pine backgrounds. */
  saffron:
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-saffron-400 px-6 py-3 text-base font-bold text-brand-950 hover:bg-[#ebbd62]',
};

export function Card({ className = '', ...props }: ComponentProps<'div'>) {
  return <div className={`rounded-2xl border border-line bg-white p-5 ${className}`} {...props} />;
}

/** FAQ list that opens and closes without JavaScript. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="border-t border-line">
      {items.map((item) => (
        <details key={item.q} className="group border-b border-line">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 text-lg font-bold text-brand-900 [&::-webkit-details-marker]:hidden">
            {item.q}
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-xl text-brand-700 transition-transform group-open:rotate-45 group-open:border-brand-900 motion-reduce:transition-none"
            >
              +
            </span>
          </summary>
          <p className="max-w-3xl pb-6 text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

/** The three steps really are a sequence, so they carry their numbers. */
export function Steps({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-10 md:grid-cols-3 md:gap-8">
      {items.map((item, i) => (
        <li key={item.title} className="relative border-t-2 border-brand-900 pt-5">
          <span
            aria-hidden
            className="font-display text-5xl font-semibold leading-none text-saffron-600"
          >
            {i + 1}
          </span>
          <h3 className="mt-4 text-xl font-bold text-brand-900">{item.title}</h3>
          <p className="mt-2 text-muted">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}

/** Facts about the firm on a pine band; real numbers only, from the firm (AGENTS.md rule 4). */
export function TrustBadges({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-brand-900 p-6">
          <dt className="text-brand-100">{item.label}</dt>
          <dd className="mt-2 font-display text-2xl font-semibold break-words text-saffron-400">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Practice areas as an index rather than a grid of cards: one row each, the name set large in the
 * display face, so the list reads like the contents page of a legal reference.
 */
export function ServiceIndex({
  items,
  headingLevel = 'h3',
}: {
  items: { href: string; title: string; summary: string }[];
  headingLevel?: 'h2' | 'h3';
}) {
  const Heading = headingLevel;
  return (
    <ul className="border-t border-line">
      {items.map((item) => (
        <li key={item.href} className="border-b border-line">
          <Link
            href={item.href}
            className="group grid gap-1 py-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] md:items-center md:gap-8"
          >
            <Heading className="font-display text-2xl font-semibold text-brand-900 sm:text-3xl">
              {item.title}
            </Heading>
            <p className="text-muted">{item.summary}</p>
            <span className="hidden size-11 items-center justify-center rounded-full border border-line text-brand-900 transition-colors group-hover:border-brand-900 group-hover:bg-brand-900 group-hover:text-white md:flex">
              <ArrowIcon />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <div className="max-w-3xl space-y-4 text-lg leading-loose text-ink">{children}</div>;
}
