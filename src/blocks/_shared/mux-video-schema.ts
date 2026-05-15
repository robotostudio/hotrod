import { z } from 'astro:content';
import { MUX_MANIFEST } from '../../generated/mux-manifest';

function suggestNearby(_badId: string): string {
  const known = Object.keys(MUX_MANIFEST);
  if (known.length === 0) return '(none — manifest is empty)';
  return known.slice(0, 3).join(', ');
}

export const muxVideoSchema = z
  .object({
    playbackId: z
      .string({ message: 'Video `playbackId` is required.' })
      .min(1, { message: 'Video `playbackId` must not be empty.' })
      .superRefine((id, ctx) => {
        if (!(id in MUX_MANIFEST)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              `Video \`playbackId\` "${id}" was not found in Mux (or is not a public playback ID). ` +
              `Upload the asset in the Mux dashboard with playback policy "public", then restart dev / rebuild. ` +
              `Known playback IDs: ${suggestNearby(id)}.`,
          });
        }
      }),
    title: z
      .string({ message: 'Video `title` is required.' })
      .min(1, { message: 'Video `title` must not be empty.' }),
  })
  .strict();

export type MuxVideo = {
  playbackId: string;
  title: string;
};
