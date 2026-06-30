import type { APIRoute } from "astro";

export const prerender = false; // the only server route; served as a function

import { parseLead } from "../../lib/leads/schema";
import { runLeadPipeline } from "../../lib/leads/pipeline";
import { rateLimit } from "../../lib/rate-limit";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let ip: string | undefined;
  try {
    ip = clientAddress;
  } catch {
    ip = undefined;
  }
  if (!rateLimit(ip).ok) {
    return json({ ok: false, error: "Too many requests. Please call (919) 441-7049." }, 429);
  }

  let parsed;
  try {
    parsed = await parseLead(request);
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  if (parsed.kind === "honeypot") return json({ ok: true }); // silently swallow bots
  if (parsed.kind === "invalid") return json({ ok: false, errors: parsed.errors }, 422);

  const { captured } = await runLeadPipeline(parsed.lead);
  if (!captured) {
    return json(
      { ok: false, error: "We couldn't save your request. Please call (919) 441-7049." },
      502,
    );
  }
  return json({ ok: true });
};
