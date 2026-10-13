'use client';

import { useState } from 'react';
import { useAdmin } from './AdminProvider';
import { primaryButton } from './ui';

/** Rebuilds the static site so saved content goes live (ADR 0005). */
export function PublishButton() {
  const { t, api } = useAdmin();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; key: string } | null>(null);

  async function publish() {
    setBusy(true);
    const result = await api('/api/admin/publish', { method: 'POST' });
    setBusy(false);
    setNotice(
      result.ok
        ? { ok: true, key: 'publish.started' }
        : {
            ok: false,
            key:
              result.code === 'publish_not_configured' ? 'publish.notConfigured' : 'publish.failed',
          },
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => void publish()}
        disabled={busy}
        className={primaryButton}
      >
        {t('publish.button')}
      </button>
      {notice && (
        <p
          role="status"
          className={`max-w-sm text-sm ${notice.ok ? 'text-emerald-800' : 'text-amber-800'}`}
        >
          {t(notice.key)}
        </p>
      )}
    </div>
  );
}
