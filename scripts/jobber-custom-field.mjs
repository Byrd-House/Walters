#!/usr/bin/env node
// One-time bootstrap for the Client custom field that carries a lead's request
// details (services, timing, message) into Jobber. Prints the configuration ID
// for JOBBER_LEAD_CUSTOM_FIELD_ID.
//
// WHY A SCRIPT AND NOT A FIELD JESSE MAKES IN THE UI: Jobber only lets an app
// read or write custom fields that the APP ITSELF created. A field created by
// hand in Settings → Custom Fields is invisible to the API — every query for it
// returns "hidden due to permissions" — so its ID can never be used here.
//
// Requires the app's Custom Field Configurations scope with WRITE, granted at
// authorization time. If the scope was marked "Optional" in the Developer Center
// it may not have been granted; see docs/JOBBER_INTEGRATION.md Part C.
//
//   node scripts/jobber-custom-field.mjs
//
// Safe to re-run: if the app already owns the field, it prints the existing ID
// instead of creating a duplicate. Reads process.env first, then .env.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const TOKEN_URL = "https://api.getjobber.com/api/oauth/token";
const GRAPHQL_URL = "https://api.getjobber.com/api/graphql";
const DEFAULT_VERSION = "2025-04-16";
const FIELD_NAME = "Website request";

function loadEnv() {
  const merged = { ...process.env };
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), "..");
    const raw = readFileSync(join(root, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && merged[m[1]] === undefined) merged[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env — rely on process.env */
  }
  return merged;
}

const env = loadEnv();

if (!env.JOBBER_CLIENT_ID || !env.JOBBER_CLIENT_SECRET || !env.JOBBER_REFRESH_TOKEN) {
  console.error(
    "Missing JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET, or JOBBER_REFRESH_TOKEN — set them in .env first.",
  );
  process.exit(1);
}

const tokenRes = await fetch(TOKEN_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    client_id: env.JOBBER_CLIENT_ID,
    client_secret: env.JOBBER_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: env.JOBBER_REFRESH_TOKEN,
  }),
});
if (!tokenRes.ok) {
  console.error(`Token refresh failed: ${tokenRes.status}`, await tokenRes.text());
  process.exit(1);
}
const { access_token: token } = await tokenRes.json();

async function gql(query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-JOBBER-GRAPHQL-VERSION": env.JOBBER_API_VERSION ?? DEFAULT_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

// Scope-denial arrives as a top-level GraphQL error, not a userError.
function isPermissionError(body) {
  return (body.errors ?? []).some((e) => /hidden due to permissions/i.test(e.message ?? ""));
}

function scopeHelp() {
  console.error(`
The app lacks WRITE on Custom Field Configurations.

  1. Jobber Developer Center → your app → Scopes → Custom Field Configurations:
     tick Read + Write, and UNTICK "Optional" so the grant is mandatory.
  2. Re-authorize (scope changes force fresh consent — Jesse must approve):
       node scripts/jobber-auth.mjs
     Put the new JOBBER_REFRESH_TOKEN in .env and Vercel.
  3. Re-run this script.`);
}

// Idempotency: the filter only ever returns fields this app created, which is
// also the only set it is allowed to write to.
const existing = await gql(`
  {
    customFieldConfigurations(filter: { createdByThisApp: true }) {
      nodes {
        ... on CustomFieldConfigurationText { id name appliesTo }
      }
    }
  }
`);
if (isPermissionError(existing)) {
  scopeHelp();
  process.exit(1);
}

const match = (existing.data?.customFieldConfigurations?.nodes ?? []).find(
  (n) => n?.name === FIELD_NAME,
);
if (match) {
  console.log(`\n✅ The app already owns "${FIELD_NAME}". Nothing created.\n`);
  console.log("JOBBER_LEAD_CUSTOM_FIELD_ID=" + match.id + "\n");
  process.exit(0);
}

// readOnly: the value is written by the website, so Jesse shouldn't hand-edit it.
// transferable: false keeps it off quotes/jobs copied from the client.
const created = await gql(
  `
  mutation CreateLeadField($input: CustomFieldConfigurationCreateTextInput!) {
    customFieldConfigurationCreateText(input: $input) {
      customFieldConfiguration {
        ... on CustomFieldConfigurationText { id name }
      }
      userErrors { message path }
    }
  }
`,
  {
    input: {
      appliesTo: "ALL_CLIENTS",
      name: FIELD_NAME,
      transferable: false,
      readOnly: true,
    },
  },
);

if (isPermissionError(created)) {
  scopeHelp();
  process.exit(1);
}
if (created.errors) {
  console.error("GraphQL error:", JSON.stringify(created.errors, null, 2));
  process.exit(1);
}

const payload = created.data?.customFieldConfigurationCreateText;
const userErrors = payload?.userErrors ?? [];
if (userErrors.length) {
  console.error("Jobber rejected the field:", userErrors.map((e) => e.message).join("; "));
  process.exit(1);
}

const id = payload?.customFieldConfiguration?.id;
if (!id) {
  console.error("No configuration ID in response:", JSON.stringify(created, null, 2));
  process.exit(1);
}

console.log(`\n✅ Created "${FIELD_NAME}" on Clients. Put this in .env and Vercel:\n`);
console.log("JOBBER_LEAD_CUSTOM_FIELD_ID=" + id + "\n");
console.log("Jobber shows the app's name and logo beside the value — that is expected for");
console.log("app-configured fields and cannot be turned off.");
