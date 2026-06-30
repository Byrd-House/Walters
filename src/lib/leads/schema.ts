import { z } from "zod";
import { serviceGroups } from "../../data/site";
import type { Lead } from "./types";

const SLUGS = serviceGroups.map((s) => s.slug);
const MIN_FILL_MS = 2500; // submissions faster than this look like bots

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  phone: z.string().trim().min(7, "Please enter a phone number").max(40),
  email: z.email("Please enter a valid email").max(200),
  address: z.string().trim().max(200).optional(),
  timing: z.enum(["", "asap", "few-weeks", "planning"]).optional(),
  message: z.string().trim().max(2000).optional(),
  services: z.array(z.string()).default([]),
});

export type ParseResult =
  | { kind: "ok"; lead: Lead }
  | { kind: "invalid"; errors: Record<string, string> }
  | { kind: "honeypot" };

export async function parseLead(request: Request): Promise<ParseResult> {
  const form = await request.formData();

  // Honeypot: real users never see/fill this field.
  if (String(form.get("company_url") ?? "").trim()) return { kind: "honeypot" };

  // Time-trap: only enforced if JS stamped the render time.
  const stamped = Number(form.get("form_rendered_at"));
  if (stamped && Date.now() - stamped < MIN_FILL_MS) return { kind: "honeypot" };

  const raw = {
    name: String(form.get("name") ?? ""),
    phone: String(form.get("phone") ?? ""),
    email: String(form.get("email") ?? ""),
    address: String(form.get("address") ?? ""),
    timing: String(form.get("timing") ?? ""),
    message: String(form.get("message") ?? ""),
    services: form
      .getAll("services")
      .map(String)
      .filter((s) => SLUGS.includes(s)),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      errors[key] ??= issue.message;
    }
    return { kind: "invalid", errors };
  }

  const d = parsed.data;
  const [firstName, ...rest] = d.name.split(/\s+/);
  const lead: Lead = {
    name: d.name,
    firstName: firstName || d.name,
    lastName: rest.join(" "),
    email: d.email,
    phone: d.phone,
    address: d.address || undefined,
    services: d.services,
    timing: d.timing || undefined,
    message: d.message || undefined,
    source: "website-quote-form",
    submittedAt: new Date().toISOString(),
  };
  return { kind: "ok", lead };
}
