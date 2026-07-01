import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL("https://walters-landscaping.example.com");
  const staticPaths = ["/", "/services", "/about", "/contact", "/blog"];
  const posts = await getCollection("blog", ({ data }) => !data.draft);

  const urls = [...staticPaths, ...posts.map((p) => `/blog/${p.id}`)]
    .map((path) => `  <url><loc>${new URL(path, base).href}</loc></url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
