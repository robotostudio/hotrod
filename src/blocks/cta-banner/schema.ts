import { z } from 'astro:content';

export const ctaBannerSchema = z
  .object({
    type: z.literal('cta-banner'),
  })
  .strict();
