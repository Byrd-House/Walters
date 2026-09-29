#!/usr/bin/env node
// One-time Jobber OAuth bootstrap: turns an authorization code into a long-lived
// refresh token for JOBBER_REFRESH_TOKEN. Requires JOBBER_CLIENT_ID,
// JOBBER_CLIENT_SECRET, and JOBBER_REDIRECT_URI (the redirect URI registered on
// the app in Jobber's Developer Center). Keep Refresh Token Rotation OFF so the
// token stays long-lived and can live in an env var.
//
//   node scripts/jobber-auth.mjs           # step 1: print the authorize URL
//   node scripts/jobber-auth.mjs <code>    # step 2: exchange the code for tokens
//
// Reads process.env first, then falls back to values in .env at the repo root.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const AUTHORIZE_URL = "https://api.getjobber.com/api/oauth/authorize";
const TOKEN_URL = "https://api.getjobber.com/api/oauth/token";

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
const clientId = env.JOBBER_CLIENT_ID;
const clientSecret = env.JOBBER_CLIENT_SECRET;
const redirectUri = env.JOBBER_REDIRECT_URI;

if (!clientId || !clientSecret || !redirectUri) {
  console.error(
    "Missing JOBBER_CLIENT_ID, JOBBER_CLIENT_SECRET, or JOBBER_REDIRECT_URI — set them in .env first.",
  );
  process.exit(1);
}

const code = process.argv[2];

if (!code) {
  const url = `${AUTHORIZE_URL}?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
  })}`;
  console.log("\n1) Open this URL, sign in to the Jobber account, and approve access:\n");
  console.log("   " + url + "\n");
  console.log("2) Jobber redirects to your redirect URI with ?code=XXXX in the address bar.");
  console.log("   Copy that code value and run:\n");
  console.log("   node scripts/jobber-auth.mjs <code>\n");
  process.exit(0);
}

// Standard OAuth 2.0 authorization_code exchange (form-encoded).
const res = await fetch(TOKEN_URL, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  }),
});

if (!res.ok) {
  console.error(`Token exchange failed: ${res.status} ${res.statusText}`);
  console.error(await res.text());
  process.exit(1);
}

const data = await res.json();
if (!data.refresh_token) {
  console.error("No refresh_token in response:", data);
  process.exit(1);
}

// Write the token straight into .env rather than relying on it being copied out
// of the terminal. The authorization code is single-use and re-authorizing REVOKES
// the previous refresh token, so a token lost between here and .env costs another
// round-trip to the account owner.
const envPath = join(dirname(fileURLToPath(import.meta.url)), "..", ".env");
let wrote = false;
try {
  const raw = readFileSync(envPath, "utf8");
  if (/^\s*JOBBER_REFRESH_TOKEN\s*=.*$/m.test(raw)) {
    writeFileSync(
      envPath,
      raw.replace(/^\s*JOBBER_REFRESH_TOKEN\s*=.*$/m, `JOBBER_REFRESH_TOKEN=${data.refresh_token}`),
    );
    wrote = true;
  }
} catch {
  /* no .env — fall back to printing */
}

const masked = data.refresh_token.slice(0, 6) + "…" + data.refresh_token.slice(-4);
if (wrote) {
  console.log(`\n✅ Success. JOBBER_REFRESH_TOKEN written to .env (${masked}).`);
  console.log("   Mirror the same value into Vercel → Settings → Environment Variables:\n");
  console.log("   npx vercel env rm JOBBER_REFRESH_TOKEN production");
  console.log("   npx vercel env add JOBBER_REFRESH_TOKEN production\n");
} else {
  console.log("\n✅ Success. Put this in your .env and Vercel project env:\n");
  console.log("JOBBER_REFRESH_TOKEN=" + data.refresh_token + "\n");
}
if (data.access_token) {
  console.log(
    `Short-lived access token (valid ~${Math.round((data.expires_in ?? 3600) / 60)} min — for`,
  );
  console.log("immediate GraphiQL/curl verification only; do NOT store it):\n");
  console.log(data.access_token + "\n");
}
console.log("The app refreshes the access token automatically via src/lib/jobber/oauth.ts.");
