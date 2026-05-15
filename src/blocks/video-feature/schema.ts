import { z } from 'astro:content';
import { muxVideoSchema } from '../_shared/mux-video-schema';

const badgeSchema = z
  .object({
    value: z
      .string({ message: '`video-feature.badges[].value` is required.' })
      .min(1, { message: '`video-feature.badges[].value` must not be empty.' }),
    label: z
      .string({ message: '`video-feature.badges[].label` is required.' })
      .min(1, { message: '`video-feature.badges[].label` must not be empty.' }),
  })
  .strict();

const tileSchema = z
  .object({
    icon: z
      .string({ message: '`video-feature.tiles[].icon` is required.' })
      .min(1, { message: '`video-feature.tiles[].icon` must not be empty.' }),
    label: z
      .string({ message: '`video-feature.tiles[].label` is required.' })
      .min(1, { message: '`video-feature.tiles[].label` must not be empty.' }),
  })
  .strict();

export const videoFeatureSchema = z
  .object({
    type: z.literal('video-feature'),
    heading: z
      .string({ message: '`video-feature.heading` is required.' })
      .min(1, { message: '`video-feature.heading` must not be empty.' }),
    body: z
      .string({ message: '`video-feature.body` is required.' })
      .min(1, { message: '`video-feature.body` must not be empty.' }),
    video: muxVideoSchema,
    badges: z
      .array(badgeSchema)
      .max(2, { message: '`video-feature.badges` can contain at most two badges (top-left, bottom-right).' }),
    tiles: z
      .array(tileSchema)
      .min(2, { message: '`video-feature.tiles` must contain at least two tiles.' })
      .max(4, { message: '`video-feature.tiles` can contain at most four tiles.' }),
  })
  .strict();
