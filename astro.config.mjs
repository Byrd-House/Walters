// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// Static output by default; the one server route (/api/quote) opts out with
// `export const prerender = false`, served as a Vercel function via the adapter.
// TODO[launch]: set the real production domain (used by sitemap, canonical URLs, OG).
export default defineConfig({
  site: 'https://walters-landscaping.example.com',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
});
