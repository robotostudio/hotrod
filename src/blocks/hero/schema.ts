import { z } from 'astro:content';

export const heroSchema = z
  .object({
    type: z.literal('hero'),
  })
  .strict();
