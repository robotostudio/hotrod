# Spec B — Mux video primitive + video-feature block

**Status:** Design approved 2026-05-15. Awaiting plan.
**Tickets:** ROB-1991 (Mux video support — update body to point here), plus one new ticket for the `video-feature` block.
**Out of scope:** Inline `<video>` MDX shortcodes. `videoRef` schema fields on existing collections. Brand-yellow Mux player styling (deferred — Mux exposes CSS vars but the v1 component uses defaults). Mux asset pagination (v1 caps at 100 public playback IDs with a console warning). Signed (token-gated) playback. Subtitles / captions configuration. Autoplay or muted variants. Per-block aspect-ratio overrides. Upload tooling. Hot reload of the manifest in dev. Per-poster overrides via Blob.

## 1. Goal

Land the second piece of Phase 4 (media support) by shipping a typed, validated Mux video pipeline alongside the first block that consumes it: `video-feature`. The block lands at v0 position 6 (between `image-feature` and `pricing`) and proves the Mux side of the media story on the live site, mirroring Spec A's Blob pattern so agents see one consistent shape across both media types.

## 2. What lands

```
src/blocks/_shared/mux-video-schema.ts   — shared { playbackId, title } Zod schema with manifest refinement
src/components/mux-video.astro           — <MuxVideo> wrapping <mux-player>
src/integrations/mux-manifest.ts         — Astro integration: list assets, write typed file
src/generated/mux-manifest.ts            — typed, regenerated, gitignored (dir already ignored from Spec A)
src/blocks/video-feature/schema.ts       — block schema
src/blocks/video-feature/index.astro     — block component
src/blocks/registry.ts                   — +1 entry
src/content/pages/index.mdx              — +1 block instance at v0 position 6
astro.config.mjs                         — +integration
package.json                             — +@mux/mux-node, +@mux/mux-player deps
```

`.env.example` already lists `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` from the Mux provisioning work. No `.gitignore` change — `src/generated/` was added by Spec A.

## 3. Data flow

1. **Build start / dev server start** — Astro integration runs at `astro:config:setup`:
   - `@mux/mux-node` `video.assets.list({ limit: 100 })` returns all assets in the Mux environment.
   - For each asset, walk `asset.playback_ids[]` and keep only entries with `policy === 'public'`. Signed IDs are skipped.
   - Writes typed `src/generated/mux-manifest.ts` exporting `MUX_MANIFEST: Record<playbackId, MuxEntry>` keyed by playback ID, with `{ assetId, aspectRatio, duration, status, title }`.
   - If the result hits the 100-asset page limit, log a console warning. V1 does not paginate.
2. **Content load** — Zod's `muxVideoSchema` validates `playbackId` exists in the manifest at refinement time. Missing key → loud failure naming the offending playback ID, the file, and up to three known IDs as hints.
3. **Render** — `<MuxVideo video={...} />` reads the manifest entry, emits `<mux-player>` with `aspect-ratio` set as inline style (from the manifest's `aspectRatio`, defaulting to `16/9`) for CLS prevention, and ships the player runtime via a single Astro `<script>` import.

## 4. Shared Mux video schema

File: `src/blocks/_shared/mux-video-schema.ts`. Strict object, both fields required, manifest-aware refinement on `playbackId`.

```ts
import { z } from 'astro:content';
import { MUX_MANIFEST } from '../../generated/mux-manifest';

const suggestNearby = (id: string): string => {
  const known = Object.keys(MUX_MANIFEST);
  if (known.length === 0) return '(none — manifest is empty)';
  return known.slice(0, 3).join(', ');
};

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
```

`suggestNearby` is a simple "first three known IDs" hint — playback IDs are opaque, so prefix matching adds no value. The point is "the manifest is non-empty and here's a sample to compare against."

**Zod-4 syntax** matches Spec A: `.superRefine((value, ctx) => ctx.addIssue({...}))` instead of `.refine`. Hand-written `type MuxVideo` instead of `z.infer<...>` (the `z` from `astro:content` doesn't resolve as a TS namespace).

## 5. `<MuxVideo>` component

File: `src/components/mux-video.astro`. Wraps Mux's web component with sensible static-site defaults.

```astro
---
import { MUX_MANIFEST } from '../generated/mux-manifest';

interface Props {
  video: { playbackId: string; title: string };
  class?: string;
}

const { video, class: className } = Astro.props;
const entry = MUX_MANIFEST[video.playbackId];
if (!entry) {
  throw new Error(
    `<MuxVideo> called with unknown playback ID "${video.playbackId}". ` +
      `This is a bug — the Zod schema should have caught this before render.`,
  );
}
const aspect = entry.aspectRatio ?? '16:9';
---
<mux-player
  playback-id={video.playbackId}
  metadata-video-title={video.title}
  stream-type="on-demand"
  style={`--media-object-fit: cover; aspect-ratio: ${aspect.replace(':', '/')};`}
  class={className}
></mux-player>

<script>
  import '@mux/mux-player';
</script>
```

Defaults: `stream-type="on-demand"`, no autoplay, no muted, no loop, default controls. The Astro `<script>` import registers the custom element on the client; Astro bundles it across the site.

Brand-yellow Mux controls are deferred. Mux exposes `--media-primary-color` and related CSS vars; a follow-up can layer those into `src/styles/global.css` rather than touch this component.

## 6. Manifest integration

File: `src/integrations/mux-manifest.ts`. Astro integration that runs at `astro:config:setup`, fetches the asset list, indexes by playback ID, writes the generated TS file.

```ts
import type { AstroIntegration } from 'astro';
import Mux from '@mux/mux-node';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

interface MuxEntry {
  assetId: string;
  aspectRatio: string | null;
  duration: number | null;
  status: string;
  title: string | null;
}

const GENERATED_PATH = 'src/generated/mux-manifest.ts';

async function buildManifest(): Promise<Record<string, MuxEntry>> {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  if (!tokenId || !tokenSecret) {
    throw new Error(
      'MUX_TOKEN_ID and MUX_TOKEN_SECRET must both be set. ' +
        'Pull them with `vercel env pull .env.local` from the linked repo. ' +
        'Without them the Mux manifest cannot be built.',
    );
  }
  const mux = new Mux({ tokenId, tokenSecret });
  const { data: assets } = await mux.video.assets.list({ limit: 100 });
  if (assets.length === 100) {
    console.warn(
      '[mux-manifest] Hit the 100-asset page limit. ' +
        'Pagination is not implemented in v1 — older assets may be missing from the manifest.',
    );
  }
  const manifest: Record<string, MuxEntry> = {};
  for (const asset of assets) {
    for (const pb of asset.playback_ids ?? []) {
      if (pb.policy !== 'public') continue;
      manifest[pb.id] = {
        assetId: asset.id,
        aspectRatio: asset.aspect_ratio ?? null,
        duration: asset.duration ?? null,
        status: asset.status,
        title: asset.meta?.title ?? null,
      };
    }
  }
  return manifest;
}

async function writeManifest(manifest: Record<string, MuxEntry>) {
  const body = `// AUTO-GENERATED by src/integrations/mux-manifest.ts — do not edit.
export const MUX_MANIFEST = ${JSON.stringify(manifest, null, 2)} as const;
export type MuxManifestKey = keyof typeof MUX_MANIFEST;
`;
  await mkdir('src/generated', { recursive: true });
  await writeFile(resolve(GENERATED_PATH), body, 'utf8');
}

export function muxManifest(): AstroIntegration {
  return {
    name: 'hotrod-mux-manifest',
    hooks: {
      'astro:config:setup': async ({ logger }) => {
        logger.info('Building Mux manifest...');
        const manifest = await buildManifest();
        await writeManifest(manifest);
        logger.info(`Mux manifest written: ${Object.keys(manifest).length} public playback IDs.`);
      },
    },
  };
}
```

**Hook timing:** `astro:config:setup` runs before content collections load — same as Spec A — so the Zod refinement can import the generated manifest.

**Bootstrap:** an empty Mux environment writes `MUX_MANIFEST = {}`. Build succeeds; any MDX reference then fails with the "not found" message.

**Dev mode caveat:** manifest is captured once at server start. New Mux uploads require a dev-server restart.

**Caching:** none in v1. Each build/dev start does one `assets.list({ limit: 100 })` call.

## 7. video-feature block

### 7.1 Schema

File: `src/blocks/video-feature/schema.ts`. Top-level matches `image-feature` (`heading` + `body`), with `video`, `badges` (0–2), and `tiles` (2–4).

```ts
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
```

`badges` has no `.min()` — index 0 maps to top-left, index 1 to bottom-right, missing indices render nothing. `tiles` is 2–4 to bracket the v0 design's range; the grid adapts based on length.

### 7.2 Component

File: `src/blocks/video-feature/index.astro`. Black-bg → owns checkerboard dividers top + bottom. Props type hand-written.

```astro
---
import { Icon } from 'astro-icon/components';
import MuxVideo from '../../components/mux-video.astro';
import CheckerboardDivider from '../../components/checkerboard-divider.astro';

type Props = {
  type: 'video-feature';
  heading: string;
  body: string;
  video: { playbackId: string; title: string };
  badges: { value: string; label: string }[];
  tiles: { icon: string; label: string }[];
};

const { heading, body, video, badges, tiles } = Astro.props;
const topLeft = badges[0];
const bottomRight = badges[1];
const tileCols =
  tiles.length === 2
    ? 'md:grid-cols-2'
    : tiles.length === 3
      ? 'md:grid-cols-3'
      : 'md:grid-cols-4';
---
<CheckerboardDivider />
<section class="bg-foreground text-background py-20 px-6">
  <div class="mx-auto max-w-5xl">
    <h2 class="text-center text-4xl md:text-5xl font-black mb-4">{heading}</h2>
    <p class="text-center text-lg md:text-xl font-semibold opacity-80 mb-12 max-w-2xl mx-auto">{body}</p>

    <div class="relative">
      <div class="aspect-video border-8 border-background overflow-hidden">
        <MuxVideo video={video} class="block w-full h-full" />
      </div>

      {topLeft && (
        <div class="absolute -top-6 -left-6 bg-background text-foreground px-5 py-3 hidden md:block">
          <div class="text-3xl font-black leading-none">{topLeft.value}</div>
          <div class="text-xs font-bold uppercase tracking-wide">{topLeft.label}</div>
        </div>
      )}
      {bottomRight && (
        <div class="absolute -bottom-6 -right-6 bg-background text-foreground px-5 py-3 hidden md:block">
          <div class="text-3xl font-black leading-none">{bottomRight.value}</div>
          <div class="text-xs font-bold uppercase tracking-wide">{bottomRight.label}</div>
        </div>
      )}
    </div>

    <div class={`grid grid-cols-2 ${tileCols} gap-4 mt-16`}>
      {tiles.map((tile) => (
        <div class="bg-background text-foreground flex items-center gap-3 p-4">
          <Icon name={`lucide:${tile.icon}`} class="size-5 shrink-0" />
          <span class="font-bold text-sm">{tile.label}</span>
        </div>
      ))}
    </div>
  </div>
</section>
<CheckerboardDivider />
```

Notes:
- Yellow border around the video is `border-8 border-background` (background token = yellow on a black-bg block, inverting against the surrounding section).
- Corner badges are `hidden md:block`: on mobile they overhang the viewport edge and look bad, so they hide. Desktop-only decoration is acceptable here — the heading + body + video + tiles still tell the full story.
- Tile grid: `grid-cols-2` on mobile (always), responsive on `md:` based on `tiles.length`.
- Icons resolve via `astro-icon` + `@iconify-json/lucide`, matching the existing convention (`<Icon name="lucide:zap" />`).

### 7.3 Registry

File: `src/blocks/registry.ts`. Add the new entry alongside the existing seven.

```ts
import { videoFeatureSchema } from './video-feature/schema';
import VideoFeatureComponent from './video-feature/index.astro';
// ...existing imports

export const blockSchemas = {
  hero: heroSchema,
  figures: figuresSchema,
  'card-grid': cardGridSchema,
  'feature-strip': featureStripSchema,
  pricing: pricingSchema,
  'cta-banner': ctaBannerSchema,
  'image-feature': imageFeatureSchema,
  'video-feature': videoFeatureSchema,
} as const;

export const blockComponents = {
  hero: HeroComponent,
  figures: FiguresComponent,
  'card-grid': CardGridComponent,
  'feature-strip': FeatureStripComponent,
  pricing: PricingComponent,
  'cta-banner': CtaBannerComponent,
  'image-feature': ImageFeatureComponent,
  'video-feature': VideoFeatureComponent,
} satisfies Record<keyof typeof blockSchemas, unknown>;
```

## 8. Homepage placement

`src/content/pages/index.mdx` gets a new block at v0 position 6 (between `image-feature` and `pricing`):

```yaml
- type: video-feature
  heading: "SEE US IN ACTION"
  body: "Watch Hotrod ship a real page in under sixty seconds — from prompt to compiled MDX to deployed preview."
  video:
    playbackId: "REPLACE_WITH_REAL_PLAYBACK_ID"
    title: "Hotrod demo: prompt to production"
  badges:
    - value: "60s"
      label: "PROMPT TO PROD"
    - value: "0"
      label: "MANUAL CODE"
  tiles:
    - icon: zap
      label: "STRICT ZOD"
    - icon: shield
      label: "LOUD ERRORS"
    - icon: car
      label: "MUX + BLOB"
    - icon: star
      label: "AGENT-FIRST"
```

The playback ID is replaced with the real one once the seed asset is uploaded (Section 9).

## 9. Operational prerequisites

**Already provisioned:** the `roboto-pro/hotrod` Vercel project has Mux integration via the marketplace. `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are set in Vercel project envs (production scope).

**Per-dev-machine setup:**
1. Repo is already linked to `roboto-pro/hotrod` (from Spec A).
2. `vercel env pull .env.local --yes` — if Mux tokens weren't pulled previously, re-pull from production: `vercel env pull .env.local --environment=production --yes`.

**Seed asset:** manual upload of one short demo video via the Mux dashboard with playback policy **public**. Copy the resulting playback ID into `src/content/pages/index.mdx`. No upload script in v1.

## 10. Configuration changes

**`astro.config.mjs`** — register the integration alongside `blobManifest()`:

```js
import { blobManifest } from './src/integrations/blob-manifest';
import { muxManifest } from './src/integrations/mux-manifest';

export default defineConfig({
  // ...existing config
  integrations: [
    blobManifest(),
    muxManifest(),
    // ...existing integrations
  ],
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
});
```

No `image.remotePatterns` change — Mux serves video directly through `<mux-player>`, not Astro's `<Image>`.

**`.gitignore`** — no change. `src/generated/` was added by Spec A.

**`.env.example`** — no edit; `MUX_TOKEN_ID` + `MUX_TOKEN_SECRET` are already listed.

**`package.json`** — add `@mux/mux-node` (used in the integration) and `@mux/mux-player` (used by the component). Both pinned to whatever `pnpm add` resolves on first install.

## 11. Failure modes

All build- and dev-time failures loud, with actionable messages.

| Trigger | Message | Surfaced via |
|---|---|---|
| Missing `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | "Pull them with `vercel env pull .env.local`..." | Integration throw at `astro:config:setup` |
| Mux API network failure | "Failed to fetch Mux manifest: ..." | Integration throw |
| MDX references missing playback ID | "Playback ID \"<id>\" was not found... known IDs: a, b, c" | Zod refinement |
| Signed-only playback ID | Same message as missing — manifest excludes non-public IDs | Zod refinement |
| Empty `video.title` | "Video `title` must not be empty." | Zod `.min(1)` |
| Missing `video` field | "Video `playbackId` is required." | Zod required |
| <2 or >4 tiles | "must contain at least two / at most four tiles." | Zod array constraints |
| >2 badges | "can contain at most two badges (top-left, bottom-right)." | Zod array max |
| Programmatic call to `<MuxVideo>` with unknown playback ID | "This is a bug — the schema should have caught this." | Component throw |
| Asset list hits 100-item page limit | Warning only — older assets may be missing | Console |

Dev mode mirrors build mode for failures; no silent fallback.

## 12. Verification plan

- **Type check:** `pnpm astro check` passes.
- **Build:** `pnpm build` passes. Confirms the integration runs, the manifest writes, the schema refines, and the new block compiles.
- **Visual:** `pnpm dev` → open `/`, scroll to position 6. Verify: centered "SEE US IN ACTION" heading + lede on black background, video panel with thick yellow border and visible Mux player controls, two corner badges floating over the top-left and bottom-right corners (desktop), four icon tiles in a row below. Checkerboard dividers above and below the section.
- **Failure cases:**
  - Temporarily reference a nonexistent playback ID in `index.mdx` → confirm Zod error names the ID + suggests known IDs.
  - Temporarily unset `MUX_TOKEN_SECRET` → confirm integration throw at startup.
  - Reduce tiles to 1 → confirm "must contain at least two tiles."

## 13. Tickets

- **ROB-1991** (Mux video support) — body updated to reference this spec. Covers the shared schema, `<MuxVideo>` component, integration, manifest, and `astro.config.mjs` + `package.json` changes.
- **NEW ticket** (video-feature block) — covers the block schema, component, registry entry, homepage instance, and seed video upload.

## 14. Sequencing after Spec B

Phase 4 is functionally complete after Spec B lands. Remaining Phase 4 tickets:

- ROB-1992 (build-time blob manifest validation) — folded into Spec A's implementation, can be closed.
- The Mux-validation equivalent of ROB-1992 doesn't have its own ticket; build-time validation is integral to Spec B and ships with ROB-1991.

After Spec B, Phase 5 (agent-facing `CLAUDE.md`, ROB-1996) becomes the natural next move — both media primitives are live, so the agent documentation can describe them concretely.
