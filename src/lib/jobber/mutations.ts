import type { Lead } from "../leads/types";
import { env } from "../env";
import { serviceGroups } from "../../data/site";

// Jobber's public API CANNOT create a "Request" (requestCreate/requestUpsert were
// removed 2023-08-18 and never re-added), and client NOTES were removed the same
// day. So a website lead is synced as a Client, and the request details ride along
// in Client custom TEXT fields. The email sink always captures the full lead
// regardless, so this sync is purely a convenience for Jesse.
export const CLIENT_CREATE = /* GraphQL */ `
  mutation CreateLead($input: ClientCreateInput!) {
    clientCreate(input: $input) {
      client { id }
      userErrors { message path }
    }
  }
`;

const titleBySlug = Object.fromEntries(serviceGroups.map((s) => [s.slug, s.title]));

// One custom field per datum. Jobber has no multi-line text type — "Area" is a
// physical measurement, not a text area — so newlines packed into a single value
// collapse when rendered and the details run together. Separate fields render as
// separate labeled rows. Keys match scripts/jobber-custom-field.mjs; a key that
// exists here but not there (or vice versa) silently drops that datum.
const FIELD_VALUES: Record<string, (lead: Lead) => string | undefined> = {
  services: (lead) => lead.services.map((s) => titleBySlug[s] ?? s).join(", ") || undefined,
  address: (lead) => lead.address,
  message: (lead) => lead.message,
  submitted: (lead) => `${lead.source} · ${lead.submittedAt}`,
};

// JOBBER_LEAD_CUSTOM_FIELD_IDS is a JSON map of key → configuration ID, printed by
// scripts/jobber-custom-field.mjs. Malformed JSON logs and degrades to no custom
// fields rather than throwing — the client still syncs, and the lead email (the
// durable capture) is unaffected either way.
function leadFieldIds(): Record<string, string> {
  const raw = env("JOBBER_LEAD_CUSTOM_FIELD_IDS");
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    console.error("[jobber] JOBBER_LEAD_CUSTOM_FIELD_IDS is not valid JSON — skipping custom fields");
    return {};
  }
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
  // The fields must be app-created: Jobber hides custom fields the app didn't
  // create, so any made by hand in Settings can never be written here. Run
  // `node scripts/jobber-custom-field.mjs` to create them and print the ID map.
  // Without it the client still syncs, just without these details.
  const ids = leadFieldIds();
  const customFields = Object.entries(FIELD_VALUES).flatMap(([key, read]) => {
    const id = ids[key];
    const value = read(lead);
    return id && value ? [{ customFieldConfigurationId: id, valueText: value }] : [];
  });
  if (customFields.length) input.customFields = customFields;
  return input;
}
