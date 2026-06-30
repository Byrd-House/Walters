// Best-effort in-memory limiter. Serverless instances are ephemeral and not
// shared, so this only throttles a warm instance — the real spam defenses are
// the honeypot + time-trap. Swap for a KV-backed limiter if abuse appears.
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

export function rateLimit(ip: string | undefined): { ok: boolean } {
  const key = ip || "unknown";
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return { ok: recent.length <= MAX_PER_WINDOW };
}
