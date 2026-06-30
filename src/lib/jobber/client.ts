import { env } from "../env";

const GRAPHQL_URL = "https://api.getjobber.com/api/graphql";
// The version header is required. [VERIFY-LIVE] the current date value in the
// Jobber changelog / GraphiQL before launch; keep it in env, never hardcoded.
const DEFAULT_VERSION = "2025-04-16";

export async function jobberGraphQL(
  query: string,
  variables: Record<string, unknown>,
  token: string,
): Promise<any> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-JOBBER-GRAPHQL-VERSION": env("JOBBER_API_VERSION") ?? DEFAULT_VERSION,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(JSON.stringify(body.errors)); // transport/schema errors
  return body; // caller also inspects data.*.userErrors
}
