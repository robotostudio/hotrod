import { z } from 'astro:content';

export const cardGridSchema = z
  .object({
    type: z.literal('card-grid'),
    title: z
      .string({ message: '`card-grid.title` is required.' })
      .min(1, { message: '`card-grid.title` must not be empty.' }),
    items: z
      .array(
        z
          .object({
            icon: z
              .string({ message: '`card-grid.items[].icon` is required.' })
              .min(1, { message: '`card-grid.items[].icon` must not be empty.' }),
            title: z
              .string({ message: '`card-grid.items[].title` is required.' })
              .min(1, { message: '`card-grid.items[].title` must not be empty.' }),
            description: z
              .string({ message: '`card-grid.items[].description` is required.' })
              .min(1, { message: '`card-grid.items[].description` must not be empty.' }),
          })
          .strict(),
      )
      .min(2, { message: '`card-grid.items` must contain at least two items.' })
      .max(4, { message: '`card-grid.items` can contain at most four items.' }),
  })
  .strict();
