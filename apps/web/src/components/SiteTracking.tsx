'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/attribution';
import { pushEvent } from '@/lib/datalayer';

/**
 * Stores ad attribution on every page load and turns clicks on `[data-event]` links (call,
 * WhatsApp) into dataLayer events. One listener covers server-rendered links too.
 */
export function SiteTracking() {
  useEffect(() => {
    try {
      captureAttribution();
    } catch {
      // Cookies blocked: the form still sends the current URL's params.
    }
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>('[data-event]');
      if (!target) return;
      pushEvent({
        event: target.dataset.event!,
        location: target.dataset.location ?? window.location.pathname,
      });
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);
  return null;
}
