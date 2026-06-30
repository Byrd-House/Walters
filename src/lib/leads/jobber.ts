import type { Lead, LeadDestination, LeadResult } from "./types";
import { env } from "../env";
import { getAccessToken } from "../jobber/oauth";
import { jobberGraphQL } from "../jobber/client";
import { CLIENT_CREATE, toClientCreateInput } from "../jobber/mutations";

// Best-effort CRM sync. Inert (skipped) until the three Jobber creds are set.
// durable=false → the pipeline never blocks the visitor's success on Jobber;
// the email sink is the guaranteed capture.
export const jobberSink: LeadDestination = {
  name: "jobber",
  durable: false,
  isConfigured: () =>
    !!(env("JOBBER_CLIENT_ID") && env("JOBBER_CLIENT_SECRET") && env("JOBBER_REFRESH_TOKEN")),
  async submit(lead: Lead): Promise<LeadResult> {
    try {
      const token = await getAccessToken();
      const body = await jobberGraphQL(CLIENT_CREATE, { input: toClientCreateInput(lead) }, token);
      const userErrors = body?.data?.clientCreate?.userErrors ?? [];
      if (userErrors.length) {
        return { ok: false, error: userErrors.map((e: { message: string }) => e.message).join("; ") };
      }
      return { ok: true, id: body?.data?.clientCreate?.client?.id };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  },
};
