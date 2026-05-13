import { z } from 'astro:content';
import { blobImageSchema } from '../_shared/blob-image-schema';

export const imageFeatureSchema = z
  .object({
    type: z.literal('image-feature'),
    heading: z
      .string({ message: '`image-feature.heading` is required.' })
      .min(1, { message: '`image-feature.heading` must not be empty.' }),
    body: z
      .string({ message: '`image-feature.body` is required.' })
      .min(1, { message: '`image-feature.body` must not be empty.' }),
    image: blobImageSchema,
    badge: z
      .string({ message: '`image-feature.badge` is required.' })
      .min(1, { message: '`image-feature.badge` must not be empty.' }),
    stats: z
      .array(
        z
          .object({
            value: z
              .string({ message: '`image-feature.stats[].value` is required.' })
              .min(1, { message: '`image-feature.stats[].value` must not be empty.' }),
            label: z
              .string({ message: '`image-feature.stats[].label` is required.' })
              .min(1, { message: '`image-feature.stats[].label` must not be empty.' }),
          })
          .strict(),
      )
      .min(1, { message: '`image-feature.stats` must contain at least one stat.' })
      .max(4, { message: '`image-feature.stats` can contain at most four stats.' }),
  })
  .strict();
