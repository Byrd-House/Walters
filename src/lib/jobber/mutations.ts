import type { Lead } from "../leads/types";
import { env } from "../env";
import { serviceGroups } from "../../data/site";

// Jobber's public API CANNOT create a "Request" (requestCreate/requestUpsert were
// removed 2023-08-18 and never re-added), and client NOTES were removed the same
// day. So a website lead is synced as a Client, and the request details (services,
// message) ride along in a Client custom TEXT field. The email sink always
// captures the full lead regardless, so this sync is purely a convenience for Jesse.
export const CLIENT_CREATE = /* GraphQL */ `
  mutation CreateLead($input: ClientCreateInput!) {
    clientCreate(input: $input) {
      client { id }
      userErrors { message path }
    }
  }
`;

const titleBySlug = Object.fromEntries(serviceGroups.map((s) => [s.slug, s.title]));

// Human-readable summary of the request, stored in the Client custom field.
function requestSummary(lead: Lead): string {
  const services = lead.services.map((s) => titleBySlug[s] ?? s).join(", ") || "(none specified)";
  const lines = [`Services: ${services}`];
  if (lead.address) lines.push(`Address: ${lead.address}`);
  if (lead.message) lines.push(`Message: ${lead.message}`);
  lines.push(`Submitted via ${lead.source} on ${lead.submittedAt}`);
  return lines.join("\n");
}

// [VERIFY-LIVE] Confirm every field name in Jobber's GraphiQL before going live:
//   emails[].address/description/primary, phones[].number (vs phoneNumbers),
//   billingAddress.{street1, city, province, postalCode},
//   customFields[].{customFieldConfigurationId, valueText}.
// Enum values (e.g. description: MAIN) are sent as JSON strings in variables — the
// server coerces them — so "MAIN" here is correct, not a bug.
export function toClientCreateInput(lead: Lead) {
  const input: Record<string, unknown> = {
    firstName: lead.firstName,
    lastName: lead.lastName || lead.firstName,
    emails: [{ description: "MAIN", primary: true, address: lead.email }],
    phones: [{ description: "MAIN", primary: true, number: lead.phone }],
  };
  if (lead.address) {
    input.billingAddress = { street1: lead.address };
  }
  // Attach the request details as a Client custom text field — but only when the
  // account's custom-field config ID is set. Run `node scripts/jobber-custom-field.mjs`
  // to create the field and print its configuration ID for JOBBER_LEAD_CUSTOM_FIELD_ID.
  // The field must be app-created: Jobber hides custom fields the app didn't create,
  // so one made by hand in Settings can never be written here. Without the ID, the
  // client is created without these details (the lead email still has them).
  const cfId = env("JOBBER_LEAD_CUSTOM_FIELD_ID");
  if (cfId) {
    input.customFields = [{ customFieldConfigurationId: cfId, valueText: requestSummary(lead) }];
  }
  return input;
}
