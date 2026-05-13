import { z } from 'astro:content';

export const pricingSchema = z
  .object({
    type: z.literal('pricing'),
  })
  .strict();
