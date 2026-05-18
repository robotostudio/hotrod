import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { buildBlocksField } from './blocks/build-blocks-field';

const dateMessage = (field: string) =>
  `\`${field}\` must be a valid ISO date, e.g. 2026-05-12.`;

const requiredString = (field: string) =>
  z
    .string({ message: `\`${field}\` is required.` })
    .min(1, { message: `\`${field}\` must not be empty.` });

// SEO descriptions are also meta descriptions. Anything under ~80 chars tends
// to get rewritten by search engines and reads as a placeholder in social
// previews. Loud failure beats silent thin-meta drift. Aim for 120–160.
const seoDescription = (field: string) =>
  z
    .string({ message: `\`${field}\` is required.` })
    .min(80, {
      message: `\`${field}\` should be at least 80 characters (aim for 120–160). It's used as the meta description and social preview, so write something with substance.`,
    })
    .max(220, {
      message: `\`${field}\` should be under 220 characters — search engines truncate longer ones.`,
    });

// Optional SEO overrides. Use these only when the on-page `title`/`description`
// don't make a great meta tag (e.g. very long, or contains site-internal jargon).
// When absent, the meta tag falls back to the required field. Same length rules apply.
const metaDescriptionOverride = seoDescription('metaDescription').optional();

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z
    .object({
      title: requiredString('title'),
      description: seoDescription('description'),
      metaDescription: metaDescriptionOverride,
      publishedAt: z.coerce.date({ message: dateMessage('publishedAt') }),
      updatedAt: z.coerce.date({ message: dateMessage('updatedAt') }).optional(),
      draft: z.boolean().default(false),
      blocks: buildBlocksField(),
    })
    .strict(),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z
    .object({
      title: requiredString('title'),
      description: seoDescription('description'),
      metaDescription: metaDescriptionOverride,
      publishedAt: z.coerce.date({ message: dateMessage('publishedAt') }),
      updatedAt: z.coerce.date({ message: dateMessage('updatedAt') }).optional(),
      author: reference('authors'),
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    })
    .strict(),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/authors' }),
  schema: z
    .object({
      name: requiredString('name'),
      role: z.string().optional(),
      shortBio: requiredString('shortBio'),
      social: z
        .object({
          twitter: z.string().optional(),
          github: z.string().optional(),
          linkedin: z.string().optional(),
          website: z.string().url({ message: '`social.website` must be a URL.' }).optional(),
        })
        .strict()
        .default({}),
      publishedAt: z.coerce.date({ message: dateMessage('publishedAt') }),
      updatedAt: z.coerce.date({ message: dateMessage('updatedAt') }).optional(),
    })
    .strict(),
});

export const collections = { pages, blog, authors };
