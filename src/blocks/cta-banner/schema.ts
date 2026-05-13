import { z } from 'astro:content';
import { buttonSchema } from '../_shared/button-schema';

export const ctaBannerSchema = z
  .object({
    type: z.literal('cta-banner'),
    title: z
      .string({ message: '`cta-banner.title` is required.' })
      .min(1, { message: '`cta-banner.title` must not be empty.' }),
    text: z
      .string({ message: '`cta-banner.text` is required.' })
      .min(1, { message: '`cta-banner.text` must not be empty.' }),
    buttons: z
      .array(buttonSchema)
      .min(1, { message: '`cta-banner.buttons` must contain at least one button.' })
      .max(2, { message: '`cta-banner.buttons` can contain at most two buttons.' }),
  })
  .strict();
