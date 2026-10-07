import type { Lead, LeadDestination, LeadResult } from "./types";

// Logs the lead so the form works end-to-end in dev without email/Jobber
// configured, where this also counts as a durable capture.
//
// Dev ONLY, and that's the point: this is the one place that logs a lead's
// contents rather than just a sink name and an error, so leaving it on in
// production wrote every real customer's name, email, phone, address and
// message into the host's runtime logs. Nothing needs them there — the email
// sink is the guaranteed capture, the request itself shows up in the platform
// log, and the privacy policy tells visitors those logs hold request metadata,
// not what they typed into the form.
//
// `durable` stays gated too, belt and braces: if this is ever re-enabled in
// production, a lead must not be reported as captured just because it was
// printed.
export const consoleSink: LeadDestination = {
  name: "console",
  durable: import.meta.env.DEV,
  isConfigured: () => import.meta.env.DEV,
  async submit(lead: Lead): Promise<LeadResult> {
    console.log("[lead]", JSON.stringify(lead));
    return { ok: true };
  },
};
