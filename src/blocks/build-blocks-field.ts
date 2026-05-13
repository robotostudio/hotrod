import { z } from 'astro:content';
import { blockSchemas } from './registry';

const schemaList = Object.values(blockSchemas) as unknown as [
  (typeof blockSchemas)[keyof typeof blockSchemas],
  ...Array<(typeof blockSchemas)[keyof typeof blockSchemas]>,
];

export function buildBlocksField() {
  return z
    .array(z.discriminatedUnion('type', schemaList))
    .min(1, {
      message:
        '`blocks` is empty. Either remove the `blocks:` line, or add at least one block entry, e.g. `- type: hero`.',
    })
    .optional();
}
