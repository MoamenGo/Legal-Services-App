import { Suspense } from 'react';
import { ReportsScreen } from '@/components/admin/ReportsScreen';

export default function AdminReportsPage() {
  return (
    <Suspense>
      <ReportsScreen />
    </Suspense>
  );
}
