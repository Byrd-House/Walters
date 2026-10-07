// Meta Conversions API — the server-side half of the Lead event.
//
// Why both halves: the browser pixel loses whatever ad blockers, Safari's ITP,
// and the iOS tracking prompt strip out, which on a local-services site is a
// large share of real leads. The server sees every submission that actually
// landed. Both halves carry the same event_id, which is how Meta collapses the
// pair into one conversion instead of counting the lead twice.
// https://developers.facebook.com/docs/marketing-api/conversions-api
//
// Called from /api/quote only after the lead pipeline reports it captured, so a
// phantom conversion can't outlive a lead that never reached Jesse.

import { env } from "../env";
import { site } from "../../data/site";
import type { Lead } from "../leads/types";

// Graph API v26.0 shipped 2026-07-29 and is current. Overridable because Meta
// retires a version roughly every two years; keep it in env, never hardcoded.
const DEFAULT_VERSION = "v26.0";

function accessToken(): string | undefined {
  return env("META_CAPI_ACCESS_TOKEN");
}

/** Needs a token AND the same pixel the browser half reports to. */
export function isCapiConfigured(): boolean {
  return Boolean(accessToken() && site.tracking.metaPixel);
}

// Meta requires SHA-256 hex for every identifying field, and normalization
// before hashing — their side hashes the same way, so a stray capital letter or
// a dash in a phone number is the difference between a match and a miss.
async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const normalizeEmail = (v: string) => v.trim().toLowerCase();

// Digits only, no leading zeros, country code included. A bare 10-digit US
// number gets the "1" Meta expects; anything longer already carries its own.
const normalizePhone = (v: string) => {
  const digits = v.replace(/\D/g, "").replace(/^0+/, "");
  return digits.length === 10 ? `1${digits}` : digits;
};

// Lowercase, letters and digits only. Meta specifies "no punctuation"; spaces go
// too so "O'Brien" and "Van Dyke" hash the same way on both sides every time.
const normalizeName = (v: string) => v.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

// Hash only non-empty values — an empty string has a perfectly valid SHA-256,
// and sending it would hand Meta a "customer" whose email is the hash of "".
const hashed = async (value: string | undefined, normalize: (v: string) => string) => {
  const normalized = normalize(value ?? "");
  return normalized ? [await sha256(normalized)] : undefined;
};

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

type LeadEvent = {
  lead: Lead;
  /** The browser's event ID for this submission; absent if JS never supplied it. */
  eventId?: string;
  request: Request;
  ip?: string;
};

/**
 * Mirrors one Lead to Meta. Never throws and never rejects — the visitor has
 * already been told their request went through, so nothing here may change the
 * response. Failures land in the platform logs instead.
 */
export async function sendLeadEvent({ lead, eventId, request, ip }: LeadEvent): Promise<void> {
  if (!isCapiConfigured()) return;

  try {
    const cookies = request.headers.get("cookie");
    const userAgent = request.headers.get("user-agent") ?? undefined;
    // The page the form was submitted from. A same-origin fetch sends a Referer,
    // so this is normally exact; the fallback keeps the event valid without
    // guessing a hostname, since /api/quote's own origin is the site's.
    const sourceUrl =
      request.headers.get("referer") ?? new URL("/contact", request.url).href;

    const payload = {
      data: [
        {
          event_name: "Lead", // must match the browser event for dedup to work
          event_time: Math.floor(new Date(lead.submittedAt).getTime() / 1000),
          ...(eventId ? { event_id: eventId } : {}),
          event_source_url: sourceUrl,
          action_source: "website",
          user_data: {
            em: await hashed(lead.email, normalizeEmail),
            ph: await hashed(lead.phone, normalizePhone),
            fn: await hashed(lead.firstName, normalizeName),
            ln: await hashed(lead.lastName, normalizeName),
            // Never hashed, per Meta: these are the signals that let a
            // server-side event be attributed to a browser and an ad click.
            ...(ip ? { client_ip_address: ip } : {}),
            ...(userAgent ? { client_user_agent: userAgent } : {}),
            ...(readCookie(cookies, "_fbp") ? { fbp: readCookie(cookies, "_fbp") } : {}),
            ...(readCookie(cookies, "_fbc") ? { fbc: readCookie(cookies, "_fbc") } : {}),
          },
          custom_data: {
            content_name: "Quote form",
            ...(lead.services.length ? { content_category: lead.services.join(",") } : {}),
          },
        },
      ],
      // Set it to route events to Events Manager's Test Events tab while
      // verifying, then unset it — test events are excluded from reporting.
      ...(env("META_CAPI_TEST_EVENT_CODE")
        ? { test_event_code: env("META_CAPI_TEST_EVENT_CODE") }
        : {}),
      // In the body, not the query string: a token in a URL ends up in access
      // logs and proxy traces.
      access_token: accessToken(),
    };

    // `||`, not `??`: an env var that exists but is empty — trivially easy to
    // leave that way in the Vercel dashboard, and how .env.example ships the
    // key — would otherwise collapse the version segment and send every event
    // to graph.facebook.com//<pixel>/events, which 404s silently.
    const version = env("META_GRAPH_API_VERSION") || DEFAULT_VERSION;
    const res = await fetch(
      `https://graph.facebook.com/${version}/${site.tracking.metaPixel}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    // Graph API answers 200 with {events_received}. Anything else is a dead
    // token, a wrong pixel, or a rejected field — all silent to the visitor, so
    // without this line the ad account quietly stops seeing server-side leads.
    if (!res.ok) {
      const detail = await res.text().catch(() => "(no body)");
      console.error(`[capi:lead] ${res.status} ${detail.slice(0, 400)}`);
      return;
    }
    const body = (await res.json().catch(() => ({}))) as { events_received?: number };
    if (body.events_received !== 1) {
      console.error(`[capi:lead] accepted but events_received=${body.events_received}`);
    }
  } catch (error) {
    // Logs the failure only, never the lead's contact details.
    console.error("[capi:lead] threw:", error instanceof Error ? error.message : error);
  }
}
