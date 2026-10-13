import Link from 'next/link';
import './globals.css';

/** Paths outside any locale (e.g. /foo). Bilingual because there is no locale to pick from. */
export default function RootNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex min-h-dvh items-center justify-center p-4 text-center font-sans">
        <main className="space-y-3">
          <p className="text-5xl font-bold text-accent-500">404</p>
          <p className="text-xl font-bold text-brand-900">الصفحة غير موجودة</p>
          <p lang="en" dir="ltr" className="text-slate-600">
            Page not found
          </p>
          <p className="flex justify-center gap-4 pt-2">
            <Link href="/ar" className="underline">
              الرئيسية
            </Link>
            <Link href="/en" lang="en" className="underline">
              Home
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
