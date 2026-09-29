import type { APIRoute } from "astro";

// Routes are derived from the pages directory rather than hand-listed. The old
// hardcoded array had already gone stale — /faq shipped without an entry — and a
// page missing from the sitemap is a page that may go uncrawled for weeks.
//
// Excluded: anything noindex or non-public. Keep this list in sync with the
// `noindex` prop on the page itself; both exist because they answer different
// questions (crawl vs. index).
const EXCLUDE = [/^\/oauth\//, /^\/404$/];

function routesFromPages(): string[] {
  const pages = import.meta.glob("./**/*.astro", { eager: true });
  return Object.keys(pages)
    .map((file) =>
      file
        .replace(/^\.\//, "/")
        .replace(/\.astro$/, "")
        .replace(/\/index$/, "/"),
    )
    .filter((route) => !EXCLUDE.some((re) => re.test(route)))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
}

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL("https://jessewalterslandscaping.com");

  const urls = routesFromPages()
    .map((path) => `  <url><loc>${new URL(path, base).href}</loc></url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
