// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// NOTE: static output is the default; the one server route (/api/quote) will opt
// out later with `export const prerender = false` + the Vercel adapter.
// TODO[launch]: set the real production domain (used by sitemap, canonical URLs, OG).
export default defineConfig({
  site: 'https://walters-landscaping.example.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
