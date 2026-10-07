// Meta Pixel conversion events, browser side.
//
// Event names are Meta's standard events and have to be spelled exactly — the
// ad account's optimization objectives match on the string, so a typo produces
// an event Events Manager accepts and no campaign can ever use:
//   Contact — "a person initiates contact with your business via telephone,
//             SMS, email, chat, etc."  (no required properties)
//   Lead    — a completed sign-up      (currency/value optional)
// https://developers.facebook.com/docs/meta-pixel/reference
//
// Every call here no-ops when fbq is absent. The pixel is gated on
// site.tracking.metaPixel in MetaPixel.astro, and a visitor running a tracker
// blocker never loads fbevents.js, so callers never test whether tracking is on.

type FbqOptions = { eventID: string };

declare global {
  interface Window {
    fbq?: (
      command: "track" | "trackCustom",
      event: string,
      params?: Record<string, unknown>,
      options?: FbqOptions,
    ) => void;
  }
}

// Unique per occurrence. Meta collapses a browser event and the same event sent
// server-side into one conversion when event name and eventID both match, so
// every event carries an ID whether or not anything mirrors it today.
export function eventId(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  return `e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Returns the eventID actually sent, or null when the pixel isn't running —
// which is also what tells a caller whether there is an ID worth mirroring.
function track(event: string, params: Record<string, unknown> = {}, id = eventId()): string | null {
  if (typeof window.fbq !== "function") return null;
  window.fbq("track", event, params, { eventID: id });
  return id;
}

// One Contact per channel per page view. Someone who taps the footer number
// twice, or clicks it and then copies it, has initiated contact once; counting
// the repeats would inflate the very number the ad account optimizes against.
const contacted = new Set<string>();

export function trackContact(
  channel: "phone" | "email",
  method: "click" | "copy",
): string | null {
  if (contacted.has(channel)) return null;
  contacted.add(channel);
  // Custom properties, no personal data: they let Events Manager break Contact
  // down by channel and gesture without defining a second event type.
  return track("Contact", { contact_channel: channel, contact_method: method });
}

export function trackLead(services: string[] = [], id = eventId()): string | null {
  return track(
    "Lead",
    {
      content_name: "Quote form",
      // Service slugs the visitor checked. Non-identifying, and the only way to
      // see in Events Manager which services the ads are actually bringing in.
      ...(services.length ? { content_category: services.join(",") } : {}),
      // No `value`/`currency`: what a lead is worth is the owner's figure to
      // give, and inventing one would make ad reporting read as revenue earned.
    },
    id,
  );
}
