'use client';

import { useEffect } from 'react';
import { pushEvent } from '@/lib/datalayer';

/**
 * Fires `generate_lead` once per lead on the thank-you page. The ids come from the query string
 * the form redirects with, so the page itself stays static.
 */
export function LeadConversion({ language }: { language: string }) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const leadId = params.get('lead');
    if (!leadId) return;
    const key = `generate_lead:${leadId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // Storage can be blocked; a rare duplicate event is better than none.
    }
    pushEvent({
      event: 'generate_lead',
      lead_id: leadId,
      case_type: params.get('case') ?? undefined,
      form_location: params.get('from') ?? undefined,
      language,
    });
  }, [language]);
  return null;
}
