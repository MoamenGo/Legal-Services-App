import { Suspense } from 'react';
import { LeadsScreen } from '@/components/admin/LeadsScreen';

export default function AdminLeadsPage() {
  // useSearchParams needs a Suspense boundary for the page to stay static.
  return (
    <Suspense>
      <LeadsScreen />
    </Suspense>
  );
}
