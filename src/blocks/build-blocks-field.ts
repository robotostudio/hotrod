import { z } from 'astro:content';
import { blockSchemas } from './registry';

const schemaList = Object.values(blockSchemas) as unknown as [
  (typeof blockSchemas)[keyof typeof blockSchemas],
  ...Array<(typeof blockSchemas)[keyof typeof blockSchemas]>,
];

export function buildBlocksField() {
  return z.array(z.discriminatedUnion('type', schemaList)).optional();
}
