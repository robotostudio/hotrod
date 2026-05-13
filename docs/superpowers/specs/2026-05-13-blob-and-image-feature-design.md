# Spec A — Vercel Blob primitive + image-feature block

**Status:** Design approved 2026-05-13. Awaiting plan.
**Tickets:** ROB-1990 (Blob image support), ROB-1992 (build-time blob manifest), plus one new ticket for the `image-feature` block.
**Out of scope:** Mux / video support — that's Spec B (`docs/superpowers/specs/2026-05-13-mux-and-video-feature-design.md` once it exists). `heroImage` / `avatar` schema fields on existing collections. Inline `image` MDX shortcodes. Image transformation controls beyond Astro's defaults. Upload tooling. Hot reload of the manifest in dev. Caching the manifest between builds.

## 1. Goal

Land the first piece of Phase 4 (media support) by shipping a typed, validated Vercel Blob pipeline alongside the first content block that consumes it: `image-feature`. The block restores v0-homepage position 5 (between `feature-strip` and `pricing`) and proves the whole pipeline end-to-end on the live site.

## 2. What lands

```
src/blocks/_shared/blob-image-schema.ts   — shared { key, alt } Zod schema with manifest refinement
src/components/blob-image.astro           — <BlobImage> wrapping Astro <Image>
src/integrations/blob-manifest.ts         — Astro integration: fetch + probe + write
src/generated/blob-manifest.ts            — typed, regenerated, gitignored
src/blocks/image-feature/schema.ts        — block schema
src/blocks/image-feature/index.astro      — block component
src/blocks/registry.ts                    — +1 entry
src/content/pages/index.mdx               — +1 block instance at v0 position 5
astro.config.mjs                          — +integration, +image.remotePatterns
.gitignore                                — ignore src/generated/
```

`.env.example` already lists `BLOB_READ_WRITE_TOKEN`; no edit needed. Verify during implementation.

## 3. Data flow

1. **Build start / dev server start** — Astro integration runs at `astro:config:setup`:
   - `@vercel/blob` `list()` returns all blobs with `{ pathname, url, contentType, size }`.
   - For each, `probe-image-size` runs an HTTP range request and reads `{ width, height }`. SVG without intrinsic dims → warning, dimensions recorded as `null`.
   - Writes typed `src/generated/blob-manifest.ts` exporting `BLOB_MANIFEST: Record<string, BlobEntry>` keyed by blob `pathname`.
2. **Content load** — Zod's `blobImageSchema` validates `key` exists in the manifest at refinement time. Missing key → loud failure naming the offending file, the bad key, and up to three near-matches.
3. **Render** — `<BlobImage key={...} alt={...} />` reads the manifest entry, passes `url` / `width` / `height` to Astro's `<Image>`, which produces optimized output through Vercel's image service in production and Astro's Sharp pipeline in dev.

## 4. Shared blob-image schema

File: `src/blocks/_shared/blob-image-schema.ts`. Strict object, both fields required, manifest-aware refinement on `key`.

```ts
import { z } from 'astro:content';
import { BLOB_MANIFEST } from '../../generated/blob-manifest';

const suggestNearby = (k: string): string => {
  const keys = Object.keys(BLOB_MANIFEST);
  const close = keys
    .filter((candidate) => candidate.startsWith(k.split('/')[0] ?? ''))
    .slice(0, 3);
  return close.length ? close.join(', ') : '(none — manifest is empty or no prefix matches)';
};

export const blobImageSchema = z
  .object({
    key: z
      .string({ message: 'Image `key` is required.' })
      .min(1, { message: 'Image `key` must not be empty.' })
      .refine((k) => k in BLOB_MANIFEST, {
        message: (k) =>
          `Image \`key\` "${k}" was not found in Vercel Blob. ` +
          `Upload it via the Vercel dashboard, then restart dev / rebuild. ` +
          `Known keys starting similarly: ${suggestNearby(k)}.`,
      }),
    alt: z
      .string({ message: 'Image `alt` is required.' })
      .min(1, { message: 'Image `alt` must not be empty.' }),
  })
  .strict();

export type BlobImage = z.infer<typeof blobImageSchema>;
```

The `suggestNearby` helper is a tiny prefix-match. It's a hint, not a fuzzy search; the goal is "did you typo `pages/index/legacy.jpg` vs `pages/index/legacy-driver.jpg`."

## 5. `<BlobImage>` component

File: `src/components/blob-image.astro`. Wraps Astro's `<Image>` from `astro:assets` when dimensions are available; falls back to a plain `<img>` when they're not (SVG without intrinsic dims).

```astro
---
import { Image } from 'astro:assets';
import { BLOB_MANIFEST } from '../generated/blob-manifest';

interface Props {
  image: { key: string; alt: string };
  class?: string;
  priority?: boolean;
  sizes?: string;
}

const {
  image,
  class: className,
  priority = false,
  sizes = '(min-width: 768px) 50vw, 100vw',
} = Astro.props;

const entry = BLOB_MANIFEST[image.key];
if (!entry) {
  throw new Error(
    `<BlobImage> called with unknown blob key "${image.key}". ` +
      `This is a bug — the Zod schema should have caught this before render.`,
  );
}
---
{entry.width && entry.height ? (
  <Image
    src={entry.url}
    alt={image.alt}
    width={entry.width}
    height={entry.height}
    sizes={sizes}
    loading={priority ? 'eager' : 'lazy'}
    decoding="async"
    fetchpriority={priority ? 'high' : undefined}
    class={className}
  />
) : (
  <img
    src={entry.url}
    alt={image.alt}
    loading={priority ? 'eager' : 'lazy'}
    decoding="async"
    class={className}
  />
)}
```

`priority` is exposed today for future use by `heroImage`. The `image-feature` block is mid-page and uses the default (`priority={false}`).

## 6. Manifest integration

File: `src/integrations/blob-manifest.ts`. Astro integration that runs at `astro:config:setup`, fetches the manifest, probes dimensions, writes the generated TS file.

```ts
import type { AstroIntegration } from 'astro';
import { list } from '@vercel/blob';
import probe from 'probe-image-size';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

interface BlobEntry {
  url: string;
  contentType: string;
  width: number | null;
  height: number | null;
}

const GENERATED_PATH = 'src/generated/blob-manifest.ts';

async function buildManifest(): Promise<Record<string, BlobEntry>> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is not set. ' +
        'Pull it with `vercel env pull .env.local` or add it to .env. ' +
        'Without it the Blob manifest cannot be built.',
    );
  }
  const { blobs } = await list({ token });
  const manifest: Record<string, BlobEntry> = {};
  for (const blob of blobs) {
    const dims = await probeDims(blob.url, blob.pathname, blob.contentType);
    manifest[blob.pathname] = {
      url: blob.url,
      contentType: blob.contentType,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
    };
  }
  return manifest;
}

async function probeDims(url: string, key: string, contentType: string) {
  try {
    const result = await probe(url);
    return { width: result.width, height: result.height };
  } catch (err) {
    if (contentType === 'image/svg+xml') {
      console.warn(
        `[blob-manifest] SVG "${key}" has no intrinsic dimensions; ` +
          `it will render without width/height and rely on CSS sizing.`,
      );
      return null;
    }
    throw new Error(
      `[blob-manifest] Failed to probe dimensions for "${key}": ${(err as Error).message}`,
    );
  }
}

async function writeManifest(manifest: Record<string, BlobEntry>) {
  const body = `// AUTO-GENERATED by src/integrations/blob-manifest.ts — do not edit.
export const BLOB_MANIFEST = ${JSON.stringify(manifest, null, 2)} as const;
export type BlobManifestKey = keyof typeof BLOB_MANIFEST;
`;
  await mkdir('src/generated', { recursive: true });
  await writeFile(resolve(GENERATED_PATH), body, 'utf8');
}

export function blobManifest(): AstroIntegration {
  return {
    name: 'hotrod-blob-manifest',
    hooks: {
      'astro:config:setup': async ({ logger }) => {
        logger.info('Building Blob manifest...');
        const manifest = await buildManifest();
        await writeManifest(manifest);
        logger.info(`Blob manifest written: ${Object.keys(manifest).length} entries.`);
      },
    },
  };
}
```

**Hook timing:** `astro:config:setup` runs before content collections are loaded — important because the Zod refinement imports the generated manifest.

**Bootstrap:** an empty manifest (zero blobs uploaded) writes `BLOB_MANIFEST = {}`. The build succeeds; any reference to a blob key then fails with the "not found" message at content-load time.

**Dev mode caveat:** manifest captured once at server start. New uploads require a dev-server restart.

**Caching:** none in v1. Each run does one `list()` plus one range probe per blob. Re-evaluate if the blob count grows past a few dozen.

## 7. image-feature block

### 7.1 Schema

File: `src/blocks/image-feature/schema.ts`. Five required fields. Stats: min 1, max 4.

```ts
import { z } from 'astro:content';
import { blobImageSchema } from '../_shared/blob-image-schema';

export const imageFeatureSchema = z
  .object({
    type: z.literal('image-feature'),
    heading: z
      .string({ message: '`image-feature.heading` is required.' })
      .min(1, { message: '`image-feature.heading` must not be empty.' }),
    body: z
      .string({ message: '`image-feature.body` is required.' })
      .min(1, { message: '`image-feature.body` must not be empty.' }),
    image: blobImageSchema,
    badge: z
      .string({ message: '`image-feature.badge` is required.' })
      .min(1, { message: '`image-feature.badge` must not be empty.' }),
    stats: z
      .array(
        z
          .object({
            value: z
              .string({ message: '`image-feature.stats[].value` is required.' })
              .min(1, { message: '`image-feature.stats[].value` must not be empty.' }),
            label: z
              .string({ message: '`image-feature.stats[].label` is required.' })
              .min(1, { message: '`image-feature.stats[].label` must not be empty.' }),
          })
          .strict(),
      )
      .min(1, { message: '`image-feature.stats` must contain at least one stat.' })
      .max(4, { message: '`image-feature.stats` can contain at most four stats.' }),
  })
  .strict();
```

### 7.2 Component

File: `src/blocks/image-feature/index.astro`. Background-coloured (yellow per the shadcn token system). No checkerboard dividers (yellow-bg rule). Props type hand-written to match existing block convention.

```astro
---
import BlobImage from '../../components/blob-image.astro';

type Props = {
  type: 'image-feature';
  heading: string;
  body: string;
  image: { key: string; alt: string };
  badge: string;
  stats: { value: string; label: string }[];
};

const { heading, body, image, badge, stats } = Astro.props;
---
<section class="bg-background text-foreground py-20 px-6">
  <div class="mx-auto max-w-7xl">
    <div class="grid md:grid-cols-2 gap-0 items-stretch">
      <div class="relative aspect-[4/3] md:aspect-auto overflow-hidden border-4 border-foreground">
        <BlobImage image={image} class="w-full h-full object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
        <div class="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" aria-hidden="true" />
        <div class="absolute bottom-0 left-0 p-6">
          <span class="bg-background text-foreground font-black text-sm px-3 py-1">{badge}</span>
        </div>
      </div>
      <div class="bg-foreground text-background p-8 md:p-12 flex flex-col justify-center border-4 border-foreground border-l-0">
        <h2 class="text-4xl md:text-5xl font-black mb-6 leading-tight">{heading}</h2>
        <p class="text-lg md:text-xl font-semibold mb-8 opacity-90 leading-relaxed">{body}</p>
        <div class="flex flex-wrap gap-6">
          {stats.map((stat) => (
            <div>
              <div class="text-3xl font-black">{stat.value}</div>
              <div class="font-semibold opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
</section>
```

Notes: gradient overlay is decorative (`aria-hidden`). `border-l-0` butts the content panel against the image's right border. Stats use `flex flex-wrap gap-6` — wraps on narrow viewports. Tokens (`bg-background`, `bg-foreground`, etc.) come from the existing shadcn-style token system in `src/styles/global.css` — `background` is yellow, `foreground` is black.

### 7.3 Registry

File: `src/blocks/registry.ts`. Add the new entry alongside the existing six.

```ts
import { imageFeatureSchema } from './image-feature/schema';
import ImageFeatureComponent from './image-feature/index.astro';
// ...existing imports

export const blockSchemas = {
  hero: heroSchema,
  figures: figuresSchema,
  'card-grid': cardGridSchema,
  'feature-strip': featureStripSchema,
  pricing: pricingSchema,
  'cta-banner': ctaBannerSchema,
  'image-feature': imageFeatureSchema,
} as const;

export const blockComponents = {
  hero: HeroComponent,
  figures: FiguresComponent,
  'card-grid': CardGridComponent,
  'feature-strip': FeatureStripComponent,
  pricing: PricingComponent,
  'cta-banner': CtaBannerComponent,
  'image-feature': ImageFeatureComponent,
} satisfies Record<keyof typeof blockSchemas, unknown>;
```

## 8. Homepage placement

`src/content/pages/index.mdx` gets a new block at v0 position 5 (between `feature-strip` and `pricing`):

```yaml
- type: image-feature
  heading: A LEGACY OF EXCELLENCE
  body: For over 35 years, HOTROD has been the heartbeat of city transportation. From our first yellow cab to a fleet of thousands, our commitment to getting you there safely has never wavered.
  image:
    key: pages/index/legacy-driver.jpg
    alt: A driver's hand on the steering wheel at sunset, city lights blurred in the windscreen
  badge: SINCE 1987
  stats:
    - { value: "35+", label: Years of Service }
    - { value: "50M+", label: Rides Completed }
    - { value: "100+", label: City Coverage }
```

## 9. Operational prerequisites

**Already provisioned:** the `roboto-pro/hotrod` Vercel project has a Vercel Blob store. `BLOB_READ_WRITE_TOKEN` is set in Vercel project envs.

**Per-dev-machine setup (one-time):**
1. `vercel link` from `/Users/jono/dev/hotrod` to link to the existing `roboto-pro/hotrod` project.
2. `vercel env pull .env.local` to fetch `BLOB_READ_WRITE_TOKEN` locally.

**Seed content:** manual upload of one image (`pages/index/legacy-driver.jpg`) via the Vercel dashboard, drag-and-drop into the existing Blob store. No upload script in v1.

## 10. Path convention

Convention, not schema-enforced: `<collection>/<slug>/<descriptive-name>.<ext>`.

Examples:
- `pages/index/legacy-driver.jpg`
- `pages/about/team-portrait.jpg`
- `blog/welcome/cover.jpg`
- `authors/jono/avatar.jpg`

The manifest validates the key exists, not that it follows the convention. README documents it; agent + human follow it voluntarily.

## 11. Configuration changes

**`astro.config.mjs`** — register the integration and whitelist the blob host for remote image optimization:

```js
import { blobManifest } from './src/integrations/blob-manifest';

export default defineConfig({
  // ...existing config
  integrations: [
    blobManifest(),
    // ...existing integrations
  ],
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
});
```

**`.gitignore`** — add `src/generated/` so the manifest never commits.

**`.env.example`** — no edit; `BLOB_READ_WRITE_TOKEN` is already listed.

## 12. Failure modes

All build- and dev-time failures loud, with actionable messages.

| Trigger | Message | Surfaced via |
|---|---|---|
| Missing `BLOB_READ_WRITE_TOKEN` | "Pull it with `vercel env pull .env.local`..." | Integration throw at `astro:config:setup` |
| Vercel Blob `list()` network failure | "Failed to fetch Blob manifest: ..." | Integration throw |
| Probe failure on raster | "Failed to probe dimensions for `<key>`: ..." | Integration throw |
| Probe returns no dims on SVG | Warning only; entry has `width: null, height: null` | Console |
| MDX references missing key | "Image `key` `<k>` was not found... similarly: a, b, c" | Zod refinement |
| Empty `image.alt` | "Image `alt` must not be empty." | Zod `.min(1)` |
| Missing `image` field | "Image `key` is required." | Zod required |
| Programmatic call to `<BlobImage>` with unknown key | "This is a bug — the schema should have caught this." | Component throw |

Dev mode mirrors build mode for failures; no silent fallback to broken images.

## 13. Verification plan

- **Type check**: `pnpm astro check` passes.
- **Build**: `pnpm build` passes. Confirms the integration runs, the manifest writes, the schema refines, and the new block compiles.
- **Visual**: `pnpm dev` → open `/`, scroll to position 5, verify the image-feature block renders with the uploaded image, badge in the bottom-left, three stats in the content panel, and no checkerboard dividers (yellow-bg rule).
- **Failure cases**:
  - Temporarily reference a nonexistent key in `index.mdx` → confirm Zod error names the key + suggests near-matches.
  - Temporarily unset `BLOB_READ_WRITE_TOKEN` → confirm integration throw at startup.

## 14. Tickets

- **ROB-1990** (Vercel Blob image support) — covers the shared schema, the `<BlobImage>` component, the integration, the manifest, and the `astro.config.mjs` changes.
- **ROB-1992** (build-time blob manifest validation) — overlaps heavily with ROB-1990; folded into the same plan but tracked separately for visibility.
- **NEW ticket** (image-feature block) — covers the block schema, component, registry entry, homepage instance, and seed upload.

## 15. Sequencing into Spec B

Spec B (Mux primitive + `video-feature` block) follows. It will mirror this design where it can:
- A shared `mux-video-schema.ts` in `_shared/`, alongside `blob-image-schema.ts`.
- A small Mux integration (no manifest probing — Mux returns playback metadata directly).
- A `video-feature` block at v0 position 6 (between `image-feature` and `pricing`).
- Reuse of the existing pulled `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` envs; no provisioning.

Not designed in detail yet — that's the next brainstorm.
