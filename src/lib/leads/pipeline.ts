import type { Lead, LeadDestination, LeadResult } from "./types";
import { consoleSink } from "./console";
import { emailSink } from "./email";
import { jobberSink } from "./jobber";

// Durable sinks first (email always; console in dev) → guarantees the lead is
// captured. Best-effort sinks (Jobber) run after and never block success.
// When JOBBER_* / RESEND_* env vars are absent, those sinks report not-configured
// and are skipped — so the form works today and Jobber/email join by setting env.
export async function runLeadPipeline(lead: Lead) {
  const active = [emailSink, jobberSink, consoleSink].filter((s) => s.isConfigured());
  const durable = active.filter((s) => s.durable);
  const best = active.filter((s) => !s.durable);

  const durableResults = await Promise.allSettled(durable.map((s) => s.submit(lead)));
  const captured = durableResults.some((r) => r.status === "fulfilled" && r.value.ok);

  const bestResults = await Promise.allSettled(best.map((s) => s.submit(lead)));

  logFailures(durable, durableResults);
  logFailures(best, bestResults);

  return { captured, durableResults, bestResults };
}

// Surface sink failures in the platform logs (Vercel → Project → Logs).
// Best-effort sinks fail silently by design — the visitor still sees success and
// email still has the lead — so without this a dead Jobber refresh token or a
// rejected field mapping goes unnoticed until someone notices the client list is
// thin. Logs the sink name and error only, never the lead's contact details.
function logFailures(sinks: LeadDestination[], results: PromiseSettledResult<LeadResult>[]) {
  results.forEach((result, i) => {
    const name = sinks[i]?.name ?? "unknown";
    if (result.status === "rejected") {
      console.error(`[lead:${name}] threw:`, result.reason);
    } else if (!result.value.ok) {
      console.error(`[lead:${name}] failed:`, result.value.error ?? "(no error message)");
    }
  });
}
