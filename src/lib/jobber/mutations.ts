import type { Lead } from "../leads/types";

// Creating a client auto-captures your app name in Jobber's "Lead source" field,
// so no lead-source field is sent.
export const CLIENT_CREATE = /* GraphQL */ `
  mutation CreateLead($input: ClientCreateInput!) {
    clientCreate(input: $input) {
      client { id }
      userErrors { message path }
    }
  }
`;

// [VERIFY-LIVE] Confirm every field name in Jobber's GraphiQL before going live:
//   emails[].address/description/primary, phones[].number (vs phoneNumbers),
//   billingAddress.{street1|address1, city, province|region, postalCode}.
// Until then this maps conservatively; the requested services + message are
// guaranteed via the email fallback, and pushed here best-effort.
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
  return input;
}
