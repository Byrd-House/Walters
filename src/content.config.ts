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
    order: z.number().default(0),
  }),
});

// Blog / Resources — dev-maintained Markdown. Drafts are hidden in production
// builds (shown in `astro dev`). Never invent stats, reviews, or claims in posts.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    author: z.string().default("Walter's"),
    draft: z.boolean().default(false),
  }),
});

export const collections = { testimonials, blog };
