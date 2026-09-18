import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Testimonials are dev-maintained content (no CMS). Add real Google review
// quotes as YAML/Markdown files in src/content/testimonials/. Never invent quotes.
const testimonials = defineCollection({
  loader: glob({ pattern: "**/*.{yaml,yml,md}", base: "./src/content/testimonials" }),
  schema: z.object({
    author: z.string(),
    location: z.string().optional(),
    rating: z.number().min(1).max(5).default(5),
    quote: z.string(),
    service: z.string().optional(),
    avatar: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { testimonials };
