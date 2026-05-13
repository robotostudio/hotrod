import { z } from 'astro:content';
import { buttonSchema } from '../_shared/button-schema';

export const heroSchema = z
  .object({
    type: z.literal('hero'),
    title: z
      .string({ message: '`hero.title` is required.' })
      .min(1, { message: '`hero.title` must not be empty.' }),
    text: z
      .string({ message: '`hero.text` is required.' })
      .min(1, { message: '`hero.text` must not be empty.' }),
    buttons: z
      .array(buttonSchema)
      .min(1, { message: '`hero.buttons` must contain at least one button.' })
      .max(3, { message: '`hero.buttons` can contain at most three buttons.' }),
  })
  .strict();
