import { z } from 'astro:content';

export const pricingSchema = z
  .object({
    type: z.literal('pricing'),
    title: z
      .string({ message: '`pricing.title` is required.' })
      .min(1, { message: '`pricing.title` must not be empty.' }),
    plans: z
      .array(
        z
          .object({
            name: z
              .string({ message: '`pricing.plans[].name` is required.' })
              .min(1, { message: '`pricing.plans[].name` must not be empty.' }),
            price: z
              .string({ message: '`pricing.plans[].price` is required.' })
              .min(1, { message: '`pricing.plans[].price` must not be empty.' }),
            unit: z
              .string({ message: '`pricing.plans[].unit` is required.' })
              .min(1, { message: '`pricing.plans[].unit` must not be empty.' }),
            features: z
              .array(z.string().min(1, { message: '`pricing.plans[].features[]` must not be empty.' }))
              .min(1, { message: '`pricing.plans[].features` must contain at least one feature.' }),
            featured: z.boolean().default(false),
            cta: z
              .object({
                label: z
                  .string({ message: '`pricing.plans[].cta.label` is required.' })
                  .min(1, { message: '`pricing.plans[].cta.label` must not be empty.' }),
                href: z
                  .string({ message: '`pricing.plans[].cta.href` is required.' })
                  .min(1, { message: '`pricing.plans[].cta.href` must not be empty.' }),
              })
              .strict(),
          })
          .strict(),
      )
      .min(2, { message: '`pricing.plans` must contain at least two plans.' })
      .max(4, { message: '`pricing.plans` can contain at most four plans.' }),
  })
  .strict();
