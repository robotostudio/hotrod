import { z } from 'astro:content';
import { BLOB_MANIFEST } from '../../generated/blob-manifest';

function suggestNearby(badKey: string): string {
  const prefix = badKey.split('/')[0] ?? '';
  const close = Object.keys(BLOB_MANIFEST)
    .filter((candidate) => candidate.startsWith(prefix))
    .slice(0, 3);
  return close.length
    ? close.join(', ')
    : '(none — manifest is empty or no prefix matches)';
}

export const blobImageSchema = z
  .object({
    key: z
      .string({ message: 'Image `key` is required.' })
      .min(1, { message: 'Image `key` must not be empty.' })
      .superRefine((k, ctx) => {
        if (!(k in BLOB_MANIFEST)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              `Image \`key\` "${k}" was not found in Vercel Blob. ` +
              `Upload it via the Vercel dashboard, then restart dev / rebuild. ` +
              `Known keys starting similarly: ${suggestNearby(k)}.`,
          });
        }
      }),
    alt: z
      .string({ message: 'Image `alt` is required.' })
      .min(1, { message: 'Image `alt` must not be empty.' }),
  })
  .strict();

export type BlobImage = {
  key: string;
  alt: string;
};
