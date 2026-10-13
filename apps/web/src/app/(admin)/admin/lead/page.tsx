import { Suspense } from 'react';
import { LeadScreen } from '@/components/admin/LeadScreen';

/** `/admin/lead?id=` rather than `/admin/leads/[id]` keeps the page a static shell. */
export default function AdminLeadPage() {
  return (
    <Suspense>
      <LeadScreen />
    </Suspense>
  );
}
