import { z } from 'astro:content';

export const featureStripSchema = z
  .object({
    type: z.literal('feature-strip'),
  })
  .strict();
