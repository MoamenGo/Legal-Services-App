'use client';

import { useAdmin } from './AdminProvider';
import type { LeadStatus } from './types';
import { statusColor } from './ui';

export function StatusBadge({ status }: { status: LeadStatus }) {
  const { t } = useAdmin();
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${statusColor[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}
