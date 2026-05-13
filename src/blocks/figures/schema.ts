import { z } from 'astro:content';

export const figuresSchema = z
  .object({
    type: z.literal('figures'),
    items: z
      .array(
        z
          .object({
            value: z
              .string({ message: '`figures.items[].value` is required.' })
              .min(1, { message: '`figures.items[].value` must not be empty.' }),
            label: z
              .string({ message: '`figures.items[].label` is required.' })
              .min(1, { message: '`figures.items[].label` must not be empty.' }),
          })
          .strict(),
      )
      .min(2, { message: '`figures.items` must contain at least two items.' })
      .max(6, { message: '`figures.items` can contain at most six items.' }),
  })
  .strict();
