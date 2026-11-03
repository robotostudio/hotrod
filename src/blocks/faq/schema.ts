import { z } from 'astro:content';

export const faqSchema = z
  .object({
    type: z.literal('faq'),
    title: z
      .string({ message: '`faq.title` is required.' })
      .min(1, { message: '`faq.title` must not be empty.' }),
    items: z
      .array(
        z
          .object({
            question: z
              .string({ message: '`faq.items[].question` is required.' })
              .min(1, { message: '`faq.items[].question` must not be empty.' }),
            answer: z
              .string({ message: '`faq.items[].answer` is required.' })
              .min(1, { message: '`faq.items[].answer` must not be empty.' }),
          })
          .strict(),
      )
      .min(2, { message: '`faq.items` must contain at least two questions.' })
      .max(10, { message: '`faq.items` can contain at most ten questions.' }),
  })
  .strict();
