# Jobber integration — step-by-step setup

How to connect the website's "Get a Quote" form to Jesse's Jobber account using a
**private developer app (Draft, never published)** and **no user seat** for Byrd House.

**What actually happens at runtime:** a form submission → `/api/quote` → each lead is
created in Jobber as a **Client** (`clientCreate`), with the services/timing/message
stored in a Client **custom text field**. Jobber's API cannot create a "Request" or a
client note, so this is the supported path. The email sink always captures the full
lead regardless, so nothing here is load-bearing for lead capture — Jobber is a
convenience sync.

Roles below are tagged **[Dev]** (Byrd House) and **[Jesse]** (account owner). Jesse's
total involvement is ~5 minutes: one authorize click + creating one custom field.

---

## Part A — Create & configure the app · [Dev] (~10 min)

1. Go to the **[Jobber Developer Center](https://developer.getjobber.com/)** and sign in
   (or create a free developer account — this is Byrd House's login, **not** a seat on
   Jesse's Jobber account).
2. **Apps → New**. Fill in the required fields (name e.g. "Jesse Walters Website", a
   short description). Everything is editable later.
3. **Scopes** — enable **read + write access to Clients** (and Custom Fields if it's a
   separate scope). These are the permissions Jesse sees on the consent screen.
4. **Redirect URI** — add `http://localhost:5173/callback`. (It doesn't need to serve
   anything; see Part B for how the code is copied. For a smoother owner experience you
   can instead use a live callback page — see "Optional: friendly callback page".)
5. **Refresh Token Rotation → OFF.** This keeps the refresh token long-lived so it can
   live in an env var with no token store. (Rotation is only mandatory to publish to the
   App Marketplace, which we're not doing. Leave the app in **Draft**.)
6. Copy the **Client ID** and **Client Secret**.

Put them in `.env` at the repo root:

```bash
JOBBER_CLIENT_ID=xxxxxxxx
JOBBER_CLIENT_SECRET=xxxxxxxx
JOBBER_REDIRECT_URI=http://localhost:5173/callback
```

---

## Part B — Authorize Jesse's account & mint the refresh token · [Dev] + [Jesse] (~5 min)

The refresh token grants access to Jesse's data, so **Jesse must approve it once** (only
an Owner/Admin can). Byrd House never needs to log into his account.

1. **[Dev]** Print the authorize URL:
   ```bash
   node scripts/jobber-auth.mjs
   ```
2. **[Dev]** Send the printed URL to Jesse.
3. **[Jesse]** Open it while logged into Jobber, review the permissions, click **Allow
   Access**. The browser redirects to `http://localhost:5173/callback?code=XXXX`. Since
   nothing runs on his localhost, he'll see a "can't connect" page — that's expected.
   **He copies the `code` value from the address bar** and sends it back.
4. **[Dev]** Exchange the code for tokens:
   ```bash
   node scripts/jobber-auth.mjs <code>
   ```
   This prints `JOBBER_REFRESH_TOKEN=…` (store it) and a short-lived **access token**
   (use it in Part C/E right away; don't store it).

Add to `.env`:

```bash
JOBBER_REFRESH_TOKEN=xxxxxxxx
JOBBER_API_VERSION=2025-04-16   # confirmed valid in Jobber's current docs; check GraphiQL for the latest
```

> Export the access token for the verification commands below:
> ```bash
> export JOBBER_TOKEN="<access token printed above>"
> ```

---

## Part C — Create the custom field & get its ID · [Jesse] + [Dev] (~3 min)

1. **[Jesse]** In Jobber: **Gear → Settings → Custom Fields → Add**. Create a **Text**
   field attached to **Clients**, named e.g. **"Website request"**. Save.
2. **[Dev]** Fetch its configuration ID with the access token:
   ```bash
   curl -s https://api.getjobber.com/api/graphql \
     -H "Authorization: Bearer $JOBBER_TOKEN" \
     -H "X-JOBBER-GRAPHQL-VERSION: 2025-04-16" \
     -H "Content-Type: application/json" \
     -d '{"query":"{ customFieldConfigurations { nodes { id name } } }"}'
   ```
   Find the node whose `name` is "Website request" and copy its `id`.

Add to `.env`:

```bash
JOBBER_LEAD_CUSTOM_FIELD_ID=<the id from above>
```

> If you skip this, clients are still created — just without the details field (details
> always remain in the lead email).

---

## Part D — Verify the schema before going live · [Dev] (~5 min)

The field mappings in `src/lib/jobber/mutations.ts` are marked `[VERIFY-LIVE]`. Confirm
them with a real test call using the access token (creates a throwaway client):

```bash
curl -s https://api.getjobber.com/api/graphql \
  -H "Authorization: Bearer $JOBBER_TOKEN" \
  -H "X-JOBBER-GRAPHQL-VERSION: 2025-04-16" \
  -H "Content-Type: application/json" \
  -d '{
    "query":"mutation($input: ClientCreateInput!){ clientCreate(input:$input){ client{ id } userErrors{ message path } } }",
    "variables":{"input":{
      "firstName":"API","lastName":"Test",
      "emails":[{"description":"MAIN","primary":true,"address":"apitest@example.com"}],
      "phones":[{"description":"MAIN","primary":true,"number":"9195550000"}],
      "billingAddress":{"street1":"1 Test St"}
    }}
  }'
```

- `userErrors: []` and a returned `client.id` → the mapping is correct.
- If a field name is rejected (e.g. `billingAddress.street1` or `phones`), fix it in
  `toClientCreateInput()` in `src/lib/jobber/mutations.ts` and re-run. Use the Developer
  Center's **Test in GraphiQL → Docs** to see exact field names.
- Delete the "API Test" client from Jobber afterward.

---

## Part E — Wire env vars into the app · [Dev]

Local `.env` now has all six values:

| Var | Where it came from |
|---|---|
| `JOBBER_CLIENT_ID` / `JOBBER_CLIENT_SECRET` | Part A |
| `JOBBER_REDIRECT_URI` | Part A |
| `JOBBER_REFRESH_TOKEN` | Part B |
| `JOBBER_API_VERSION` | `2025-04-16` (verify latest) |
| `JOBBER_LEAD_CUSTOM_FIELD_ID` | Part C |

Set the **same values in Vercel**: Project → **Settings → Environment Variables** →
add each for **Production** (and Preview if you want test submissions to sync). Redeploy
so the function picks them up. `JOBBER_REDIRECT_URI` isn't needed in Vercel (only the
one-time bootstrap uses it), but it's harmless to include.

The Jobber sink activates automatically once `JOBBER_CLIENT_ID`, `JOBBER_CLIENT_SECRET`,
and `JOBBER_REFRESH_TOKEN` are present — no code change (`src/lib/leads/jobber.ts`).

---

## Part F — Test end-to-end & confirm · [Dev] + [Jesse]

1. **[Dev]** With env set locally, submit a lead (dev server running):
   ```bash
   curl -s -X POST http://localhost:4322/api/quote \
     -H "Origin: http://localhost:4322" \
     -F "name=Pipeline Test" -F "phone=9195551234" -F "email=pipeline@example.com" \
     -F "address=123 Main St, Chapel Hill NC" -F "timing=asap" \
     -F "message=End-to-end Jobber test." \
     -F "services=property-maintenance" -F "services=hardscaping"
   ```
   Expect `{"ok":true}`.
2. **[Jesse]** Confirm a **"Pipeline Test"** client appears in Jobber with the **Website
   request** field populated (services, timing, message). Delete the test client.
3. **[Jesse]** Make sure **new-client notifications** are on (so real leads ping his
   phone): Gear → Notifications.
4. Ship it — submit the real form on the deployed site once as a final check.

---

## Optional: friendly callback page (smoother for Jesse)

Instead of Jesse copying the code from a broken localhost page, we can add a tiny
`/oauth/callback` page to the live site that displays the code in a copyable box. Then
register the Redirect URI as `https://<site>/oauth/callback`. Ask Byrd House to add it if
the localhost copy step is awkward — it's ~15 lines and not required.

## Troubleshooting

- **Token exchange 400/401** — client ID/secret wrong, `redirect_uri` doesn't exactly
  match the one registered on the app, or the `code` was already used/expired (they're
  one-time; re-run Part B step 1 for a fresh one).
- **Subsequent API calls 401 after ~an hour** — the refresh token is stale. This should
  not happen with rotation OFF; if it does, rotation may still be ON — turn it off and
  re-mint (Part B).
- **`clientCreate` returns userErrors** — a field name or enum mismatch; fix in
  `toClientCreateInput()` per Part D. The lead is unaffected (email already captured it).
- **Version header errors** — the `JOBBER_API_VERSION` date is retired; set the current
  one from GraphiQL / the changelog.
