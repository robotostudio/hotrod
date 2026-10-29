import { z } from 'astro:content';

export const faqSchema = z
  .object({
    type: z.literal('faq'),
    groups: z
      .array(
        z
          .object({
            title: z
              .string({ message: '`faq.groups[].title` is required.' })
              .min(1, { message: '`faq.groups[].title` must not be empty.' }),
            items: z
              .array(
                z
                  .object({
                    question: z
                      .string({ message: '`faq.groups[].items[].question` is required.' })
                      .min(1, { message: '`faq.groups[].items[].question` must not be empty.' }),
                    answer: z
                      .string({ message: '`faq.groups[].items[].answer` is required.' })
                      .min(1, { message: '`faq.groups[].items[].answer` must not be empty.' }),
                  })
                  .strict(),
              )
              .min(1, { message: '`faq.groups[].items` must contain at least one item.' }),
          })
          .strict(),
      )
      .min(1, { message: '`faq.groups` must contain at least one group.' }),
  })
  .strict();
