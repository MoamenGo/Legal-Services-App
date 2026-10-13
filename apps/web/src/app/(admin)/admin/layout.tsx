import type { Metadata } from 'next';
import { AdminProvider } from '@/components/admin/AdminProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import type { AdminBundle } from '@/components/admin/types';
import ar from '../../../../messages/ar.json';
import en from '../../../../messages/en.json';
import { plexArabic } from '../../fonts';
import '../../globals.css';

export const metadata: Metadata = {
  title: `${ar.admin.title} | ${en.admin.title}`,
  robots: { index: false, follow: false },
};

// Only the admin strings ship to the browser, not the whole public site's messages.
const bundle: AdminBundle = {
  ar: {
    admin: ar.admin,
    form: { caseTypes: ar.form.caseTypes, preferredContacts: ar.form.preferredContacts },
  },
  en: {
    admin: en.admin,
    form: { caseTypes: en.form.caseTypes, preferredContacts: en.form.preferredContacts },
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plexArabic.variable}>
      <body className="font-sans">
        <AdminProvider bundle={bundle}>
          <AdminShell>{children}</AdminShell>
        </AdminProvider>
      </body>
    </html>
  );
}
