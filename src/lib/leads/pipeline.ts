import type { Lead } from "./types";
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

  return { captured, durableResults, bestResults };
}
