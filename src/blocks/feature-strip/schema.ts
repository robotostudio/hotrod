import { z } from 'astro:content';

export const featureStripSchema = z
  .object({
    type: z.literal('feature-strip'),
    title: z
      .string({ message: '`feature-strip.title` is required.' })
      .min(1, { message: '`feature-strip.title` must not be empty.' }),
    items: z
      .array(
        z
          .object({
            icon: z
              .string({ message: '`feature-strip.items[].icon` is required.' })
              .min(1, { message: '`feature-strip.items[].icon` must not be empty.' }),
            title: z
              .string({ message: '`feature-strip.items[].title` is required.' })
              .min(1, { message: '`feature-strip.items[].title` must not be empty.' }),
            description: z
              .string({ message: '`feature-strip.items[].description` is required.' })
              .min(1, { message: '`feature-strip.items[].description` must not be empty.' }),
          })
          .strict(),
      )
      .min(3, { message: '`feature-strip.items` must contain at least three items.' })
      .max(6, { message: '`feature-strip.items` can contain at most six items.' }),
  })
  .strict();
