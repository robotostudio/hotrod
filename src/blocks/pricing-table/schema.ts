import { z } from 'astro:content';

export const pricingTableSchema = z
  .object({
    type: z.literal('pricing-table'),
    title: z
      .string({ message: '`pricing-table.title` is required.' })
      .min(1, { message: '`pricing-table.title` must not be empty.' }),
    columns: z
      .array(z.string().min(1, { message: '`pricing-table.columns[]` must not be empty.' }))
      .min(2, { message: '`pricing-table.columns` must contain at least two columns.' })
      .max(6, { message: '`pricing-table.columns` can contain at most six columns.' }),
    rows: z
      .array(
        z
          .array(z.string().min(1, { message: '`pricing-table.rows[][]` cells must not be empty.' }))
          .min(2, { message: '`pricing-table.rows[]` must contain at least two cells.' }),
      )
      .min(1, { message: '`pricing-table.rows` must contain at least one row.' }),
  })
  .strict()
  .refine((block) => block.rows.every((row) => row.length === block.columns.length), {
    message: 'Every `pricing-table.rows[]` entry must have one cell per column.',
  });
