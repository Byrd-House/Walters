#!/usr/bin/env node
// Creates the Client custom fields that carry a website lead's request details
// into Jobber, and prints JOBBER_LEAD_CUSTOM_FIELD_IDS.
//
// WHY ONE FIELD PER DATUM: Jobber has no multi-line text custom field. The six
// types are Text, Area, Link, Numeric, TrueFalse and Dropdown — and "Area" is a
// physical measurement (length × width + unit), not a text area. Newlines inside
// a single Text value are stored but collapse when Jobber renders them, so a
// packed summary runs together on one line. Separate fields render as separate
// labeled rows, which is the only way to get real visual separation.
//
// WHY A SCRIPT AND NOT FIELDS MADE BY HAND: Jobber only lets an app read or write
// custom fields the APP ITSELF created. A field added in Settings → Custom Fields
// is invisible to the API — every query returns "hidden due to permissions" — so
// its ID can never be used here.
//
//   node scripts/jobber-custom-field.mjs
//
// Idempotent: existing fields are reused, missing ones created, and app-owned
// fields that are no longer part of the set are archived. Reads process.env, then .env.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const TOKEN_URL = "https://api.getjobber.com/api/oauth/token";
const GRAPHQL_URL = "https://api.getjobber.com/api/graphql";
const DEFAULT_VERSION = "2025-04-16";

// key → the label Jesse sees on the client record. Keys are the contract with
// src/lib/jobber/mutations.ts; renaming one here without renaming it there drops
// that datum silently. Labels avoid colliding with Jobber's own built-in fields
// ("Service address", not "Address", which would sit beside the billing address).
const FIELDS = [
  { key: "services", label: "Services requested" },
  { key: "address", label: "Service address" },
  { key: "message", label: "Message" },
  { key: "submitted", label: "Submitted" },
];

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

// Scope denial arrives as a top-level GraphQL error, not a userError.
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
  3. Re-run this script.`);
}

// Only ever returns fields this app created, which is also the only set it may write.
const existing = await gql(`
  {
    customFieldConfigurations(filter: { createdByThisApp: true }) {
      nodes {
        ... on CustomFieldConfigurationText { id name }
      }
    }
  }
`);
if (isPermissionError(existing)) {
  scopeHelp();
  process.exit(1);
}

const owned = (existing.data?.customFieldConfigurations?.nodes ?? []).filter(Boolean);
const byLabel = new Map(owned.map((n) => [n.name, n.id]));

const ids = {};
for (const { key, label } of FIELDS) {
  if (byLabel.has(label)) {
    ids[key] = byLabel.get(label);
    console.log(`  = ${label} (exists)`);
    continue;
  }
  // readOnly: the website owns the value, so hand-edits would be overwritten.
  // transferable: false keeps it off quotes/jobs copied from the client.
  const created = await gql(
    `mutation Create($input: CustomFieldConfigurationCreateTextInput!) {
      customFieldConfigurationCreateText(input: $input) {
        customFieldConfiguration { ... on CustomFieldConfigurationText { id } }
        userErrors { message path }
      }
    }`,
    { input: { appliesTo: "ALL_CLIENTS", name: label, transferable: false, readOnly: true } },
  );
  if (isPermissionError(created)) {
    scopeHelp();
    process.exit(1);
  }
  const errs = created.data?.customFieldConfigurationCreateText?.userErrors ?? [];
  if (created.errors || errs.length) {
    console.error(
      `Failed to create "${label}":`,
      JSON.stringify(created.errors ?? errs, null, 2),
    );
    process.exit(1);
  }
  ids[key] = created.data.customFieldConfigurationCreateText.customFieldConfiguration.id;
  console.log(`  + ${label} (created)`);
}

// Retire app-owned fields no longer in the set (e.g. the single packed "Website
// request" field this replaced). Jobber REFUSES to archive any field associated
// with an app — including the app's own — so a field this script creates can
// never be removed through the API. Renaming is the only lever available, so a
// retired field is relabelled to read as dead rather than sitting beside the live
// ones looking current. Deleting it for real is a manual step in Jobber's UI.
const RETIRED = " (retired)";
const wanted = new Set(FIELDS.map((f) => f.label));
for (const node of owned) {
  if (wanted.has(node.name) || node.name.endsWith(RETIRED)) continue;
  const renamed = await gql(
    `mutation Retire($id: EncodedId!, $input: CustomFieldConfigurationEditInput!) {
      customFieldConfigurationEdit(customFieldConfigurationId: $id, input: $input) {
        userErrors { message path }
      }
    }`,
    { id: node.id, input: { name: node.name + RETIRED } },
  );
  const errs = renamed.data?.customFieldConfigurationEdit?.userErrors ?? [];
  if (renamed.errors || errs.length) {
    console.error(`  ! could not retire "${node.name}":`, JSON.stringify(renamed.errors ?? errs));
  } else {
    console.log(`  ~ ${node.name} → "${node.name}${RETIRED}" (unused; delete by hand in Jobber)`);
  }
}

console.log("\n✅ Fields ready. Put this in .env and Vercel:\n");
console.log("JOBBER_LEAD_CUSTOM_FIELD_IDS=" + JSON.stringify(ids) + "\n");
console.log("Jobber shows the app's name and logo beside each value — that is expected for");
console.log("app-configured fields and cannot be turned off.");
