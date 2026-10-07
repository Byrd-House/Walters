// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// Static output by default; the one server route (/api/quote) opts out with
// `export const prerender = false`, served as a Vercel function via the adapter.
export default defineConfig({
  site: 'https://jessewalterslandscaping.com',
  // Deliberately no `webAnalytics: { enabled: true }` here: two Vercel bot PRs
  // set up Web Analytics twice, once through this option and once as
  // <Analytics /> in BaseLayout, and one of them had to go.
  //
  // Both were loading in production, but not twice over — the adapter's
  // head-inline script appends /_vercel/insights/script.js during parsing, then
  // @vercel/analytics' deferred module script finds that tag and bails out of
  // injecting its own. That only holds while both resolve to the identical src
  // and while inline still runs before module; set `basePath`/`scriptSrc` on the
  // component, or change either side, and page views silently start counting
  // double. In dev they already both load, from two different debug URLs.
  //
  // Kept the component because it's the path Vercel documents, and because v2
  // varies the intake URL so fewer blockers catch it.
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});
