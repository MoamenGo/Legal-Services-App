type DataLayerEvent = { event: string } & Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

/** Pushes an event for GTM. Event names and fields follow AGENTS.md section 8. */
export function pushEvent(event: DataLayerEvent) {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(event);
}
