import type { Lead, LeadDestination, LeadResult } from "./types";

// Logs the lead. In dev this counts as a durable capture so the form works
// end-to-end without email/Jobber configured. In production it does NOT count
// as durable — the email sink is the guaranteed capture.
export const consoleSink: LeadDestination = {
  name: "console",
  durable: import.meta.env.DEV,
  isConfigured: () => true,
  async submit(lead: Lead): Promise<LeadResult> {
    console.log("[lead]", JSON.stringify(lead));
    return { ok: true };
  },
};
