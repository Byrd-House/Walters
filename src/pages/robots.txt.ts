import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const sitemap = site ? new URL("sitemap.xml", site).href : "/sitemap.xml";
  // /oauth/callback is a one-time setup landing page, not public content.
  const body = `User-agent: *\nAllow: /\nDisallow: /oauth/\n\nSitemap: ${sitemap}\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
