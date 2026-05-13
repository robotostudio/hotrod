import { z } from 'astro:content';

export const buttonSchema = z
  .object({
    label: z
      .string({ message: '`buttons[].label` is required.' })
      .min(1, { message: '`buttons[].label` must not be empty.' }),
    href: z
      .string({ message: '`buttons[].href` is required.' })
      .min(1, { message: '`buttons[].href` must not be empty.' }),
    variant: z.enum(['filled', 'outlined']).default('filled'),
    icon: z.string().optional(),
  })
  .strict();
