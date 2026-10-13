import { firm } from '@/content/cms';
import { ChatIcon, PhoneIcon, WhatsAppIcon } from './icons';

const waLink = (e164: string) => `https://wa.me/${e164.replace(/\D/g, '')}`;

/**
 * Sticky mobile bar: Call | WhatsApp | Request consultation. Call and WhatsApp only appear once
 * the firm's numbers are set in /admin Settings.
 */
export function StickyCta({
  labels,
}: {
  labels: { call: string; whatsapp: string; consultation: string };
}) {
  return (
    <nav
      aria-label={labels.consultation}
      className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-white/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
    >
      {firm.phone && (
        <a
          href={`tel:${firm.phone}`}
          data-event="click_to_call"
          data-location="sticky_bar"
          className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full border-2 border-brand-900 text-sm font-bold text-brand-900"
        >
          <PhoneIcon />
          {labels.call}
        </a>
      )}
      {firm.whatsapp && (
        <a
          href={waLink(firm.whatsapp)}
          data-event="whatsapp_click"
          data-location="sticky_bar"
          rel="noopener"
          className="flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full bg-[#1f8f4e] text-sm font-bold text-white"
        >
          <WhatsAppIcon />
          {labels.whatsapp}
        </a>
      )}
      <a
        href="#consultation"
        className="flex min-h-11 flex-[1.4] items-center justify-center gap-1 rounded-full bg-brand-900 text-sm font-bold text-white"
      >
        <ChatIcon />
        {labels.consultation}
      </a>
    </nav>
  );
}

export { waLink };
