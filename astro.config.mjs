// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// Static output by default; the one server route (/api/quote) opts out with
// `export const prerender = false`, served as a Vercel function via the adapter.
export default defineConfig({
  site: 'https://jessewalterslandscaping.com',
  adapter: vercel({
    webAnalytics: { enabled: true },
  }),
  vite: {
    plugins: [tailwindcss()],
  },
});
