import { z } from 'astro:content';

export const figuresSchema = z
  .object({
    type: z.literal('figures'),
  })
  .strict();
