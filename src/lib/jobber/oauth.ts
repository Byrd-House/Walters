import { env } from "../env";

const TOKEN_URL = "https://api.getjobber.com/api/oauth/token";

// Exchange the long-lived refresh token for a short-lived access token (~60 min).
// NOTE: if the Jobber app has Refresh Token Rotation ON, each call returns a NEW
// refresh token that must be persisted (env vars are immutable at runtime — use a
// durable store like Vercel KV). Confirm the app's rotation setting. [VERIFY-LIVE]
export async function getAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env("JOBBER_CLIENT_ID"),
      client_secret: env("JOBBER_CLIENT_SECRET"),
      grant_type: "refresh_token",
      refresh_token: env("JOBBER_REFRESH_TOKEN"),
    }),
  });
  if (!res.ok) throw new Error(`Jobber token ${res.status}`);
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Jobber token: no access_token");
  return data.access_token;
}
