import { z } from 'astro:content';

export const reviewCarouselSchema = z
  .object({
    type: z.literal('review-carousel'),
    title: z
      .string({ message: '`review-carousel.title` is required.' })
      .min(1, { message: '`review-carousel.title` must not be empty.' }),
    items: z
      .array(
        z
          .object({
            quote: z
              .string({ message: '`review-carousel.items[].quote` is required.' })
              .min(1, { message: '`review-carousel.items[].quote` must not be empty.' }),
            name: z
              .string({ message: '`review-carousel.items[].name` is required.' })
              .min(1, { message: '`review-carousel.items[].name` must not be empty.' }),
            role: z
              .string({ message: '`review-carousel.items[].role` must be text.' })
              .min(1, { message: '`review-carousel.items[].role` must not be empty.' })
              .optional(),
          })
          .strict(),
      )
      .min(3, { message: '`review-carousel.items` must contain at least three reviews.' })
      .max(8, { message: '`review-carousel.items` can contain at most eight reviews.' }),
  })
  .strict();
