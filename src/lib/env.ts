// Read an env var at runtime. process.env holds Vercel/Netlify dashboard secrets
// at runtime; import.meta.env holds local .env values in dev. Try both.
export function env(key: string): string | undefined {
  const fromProcess = typeof process !== "undefined" ? process.env?.[key] : undefined;
  const meta = import.meta.env as unknown as Record<string, string | undefined>;
  return fromProcess ?? meta[key];
}
