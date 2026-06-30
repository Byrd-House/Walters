import type { Lead, LeadDestination, LeadResult } from "./types";
import { env } from "../env";
import { serviceGroups } from "../../data/site";

const titleBySlug = Object.fromEntries(serviceGroups.map((s) => [s.slug, s.title]));

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function renderHtml(lead: Lead): string {
  const services = lead.services.map((s) => titleBySlug[s] ?? s).join(", ") || "(none)";
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#5e7e6f;">${label}</td><td style="padding:4px 0;color:#1d3028;"><strong>${value}</strong></td></tr>`;
  return `
  <div style="font-family:system-ui,sans-serif;max-width:560px">
    <h2 style="color:#355448">New quote request</h2>
    <table style="border-collapse:collapse;font-size:14px">
      ${row("Name", escapeHtml(lead.name))}
      ${row("Phone", escapeHtml(lead.phone))}
      ${row("Email", escapeHtml(lead.email))}
      ${row("Services", escapeHtml(services))}
      ${row("Address", escapeHtml(lead.address ?? "(none)"))}
      ${row("Timing", escapeHtml(lead.timing ?? "(none)"))}
    </table>
    <p style="margin-top:16px;color:#5e7e6f;font-size:14px">Message</p>
    <p style="white-space:pre-wrap;color:#1d3028;font-size:14px">${escapeHtml(lead.message ?? "(none)")}</p>
    <hr style="border:none;border-top:1px solid #d8d2c7;margin:16px 0" />
    <p style="color:#7a8360;font-size:12px">Source: ${escapeHtml(lead.source)} · ${escapeHtml(lead.submittedAt)}</p>
  </div>`;
}

// Durable capture via Resend's REST API (no SDK). Requires a verified sending
// domain. Inert (skipped) until RESEND_API_KEY + LEAD_FALLBACK_EMAIL are set.
export const emailSink: LeadDestination = {
  name: "email",
  durable: true,
  isConfigured: () => !!(env("RESEND_API_KEY") && env("LEAD_FALLBACK_EMAIL")),
  async submit(lead: Lead): Promise<LeadResult> {
    const apiKey = env("RESEND_API_KEY")!;
    const to = env("LEAD_FALLBACK_EMAIL")!;
    const from = env("LEAD_FROM_EMAIL") ?? "Walter's Website <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        reply_to: lead.email,
        subject: `New quote request: ${lead.name}`,
        html: renderHtml(lead),
      }),
    });
    if (!res.ok) return { ok: false, error: `resend ${res.status}` };
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  },
};
