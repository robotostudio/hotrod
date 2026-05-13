import { z } from 'astro:content';

export const cardGridSchema = z
  .object({
    type: z.literal('card-grid'),
  })
  .strict();
