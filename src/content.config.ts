import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { buildBlocksField } from './blocks/build-blocks-field';

const dateMessage = (field: string) =>
  `\`${field}\` must be a valid ISO date, e.g. 2026-05-12.`;

const requiredString = (field: string) =>
  z
    .string({ message: `\`${field}\` is required.` })
    .min(1, { message: `\`${field}\` must not be empty.` });

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z
    .object({
      title: requiredString('title'),
      description: requiredString('description'),
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
      description: requiredString('description'),
      publishedAt: z.coerce.date({ message: dateMessage('publishedAt') }),
      updatedAt: z.coerce.date({ message: dateMessage('updatedAt') }).optional(),
      author: reference('authors'),
      tags: z.array(z.string()).default([]),
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
