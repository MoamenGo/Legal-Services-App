import { resolveLocale } from '@/lib/locale';
import { SiteFooter } from '@/components/SiteFooter';
import { LandingHeader } from '@/components/SiteHeader';

/** Google Ads landing pages: no main navigation, so the only way forward is the form or a call. */
export default async function LandingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Each layout sets the locale too: layouts and pages render in parallel.
  await resolveLocale(params);
  return (
    <>
      <LandingHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter minimal />
    </>
  );
}
