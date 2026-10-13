import { notFound } from 'next/navigation';

/** Sends unknown paths under a locale to the localized 404 page. */
export default function CatchAll() {
  notFound();
}
