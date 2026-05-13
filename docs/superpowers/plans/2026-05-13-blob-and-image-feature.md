# Vercel Blob + image-feature block — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the Vercel Blob primitive (shared `{ key, alt }` schema, `<BlobImage>` component, build-time manifest via Astro integration) plus the `image-feature` pagebuilder block, and place the first instance on the homepage at v0 position 5.

**Architecture:** An Astro integration runs at `astro:config:setup` (before content collections load), fetches the Blob manifest with `@vercel/blob` `list()`, probes each blob with `probe-image-size` for dimensions, and writes a typed `src/generated/blob-manifest.ts`. A shared Zod schema imports that file and refines blob keys against it. A `<BlobImage>` Astro component wraps Astro's `<Image>` from `astro:assets` for remote optimization (falling back to plain `<img>` for SVGs without intrinsic dimensions). The `image-feature` block uses the shared schema and renders a yellow-bg two-column composition. No checkerboard dividers (yellow-bg rule). House style: kebab-case files, strict Zod with path-qualified messages, semantic Tailwind tokens (`bg-background`, `bg-foreground`).

**Tech Stack:** Astro 6, MDX, Tailwind v4 (with shadcn-style token system), strict Zod via `astro:content`, `@vercel/blob`, `probe-image-size`, Vercel image service.

**Spec reference:** `docs/superpowers/specs/2026-05-13-blob-and-image-feature-design.md`.

**Verification model:** No test framework is configured (per project convention). Verification is `pnpm astro check` (types), `pnpm build` (route generation + schema validation), and visual smoke in `pnpm dev`. Each task ends with `pnpm astro check` and a commit.

**Tickets:** ROB-1990 (Blob primitive), ROB-1992 (manifest validation), ROB-2000 (image-feature block).

---

## File structure overview

```
NEW
├── src/integrations/blob-manifest.ts           — Astro integration (fetch, probe, write)
├── src/generated/blob-manifest.ts              — typed, regenerated each run, gitignored
├── src/blocks/_shared/blob-image-schema.ts     — shared { key, alt } Zod with manifest refinement
├── src/components/blob-image.astro             — <BlobImage> wrapping Astro <Image>
├── src/blocks/image-feature/schema.ts          — block schema
└── src/blocks/image-feature/index.astro        — block component

MODIFIED
├── astro.config.mjs                            — register integration; image.remotePatterns
├── .gitignore                                  — ignore src/generated/
├── src/blocks/registry.ts                      — +1 entry for image-feature
├── src/content/pages/index.mdx                 — +1 block instance at v0 position 5
└── package.json + pnpm-lock.yaml               — +@vercel/blob, +probe-image-size
```

Each file has one clear responsibility. The integration handles I/O; the generated file is pure data; the shared schema is validation only; the component is render only.

---

## Bootstrap note

The generated manifest file is gitignored. On a fresh clone, the file doesn't exist until `astro dev`, `astro build`, or `astro check` runs the integration (which happens at `astro:config:setup`, before content loads). For this plan, Task 2 manually seeds an empty stub locally so subsequent tasks' `pnpm astro check` runs succeed in editor-isolated environments. The README documents this for downstream devs.

---

## Task 1: Operational setup — link Vercel, pull env, install dependencies

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

This is one-time setup. The first two sub-steps interact with the user's Vercel account and must be run by the user (or in an authenticated session); the dep install and commit are automatable.

- [ ] **Step 1: Link the local repo to the Vercel project (user-run)**

```bash
vercel link
```

Choose: scope `roboto-pro`, project `hotrod`. Confirms by writing `.vercel/project.json` (gitignored). If the command fails with "Not authorized," the user runs `vercel login` first.

Expected: prompt cycle completes; `.vercel/project.json` exists.

- [ ] **Step 2: Pull production env vars locally (user-run)**

```bash
vercel env pull .env.local
```

Expected: `.env.local` written with at least `BLOB_READ_WRITE_TOKEN=vercel_blob_rw_…` and `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET`. Verify with `grep BLOB_READ_WRITE_TOKEN .env.local`.

- [ ] **Step 3: Install dependencies**

```bash
pnpm add @vercel/blob probe-image-size
pnpm add -D @types/probe-image-size
```

Expected: lockfile updated, packages resolve. Note `@types/probe-image-size` may or may not exist on npm at install time — if it 404s, skip the devDependency line; `probe-image-size` may ship its own types. Verify with `pnpm list @vercel/blob probe-image-size`.

- [ ] **Step 4: Verify type check still passes on the clean tree**

Run: `pnpm astro check`
Expected: 0 errors, 0 warnings. (No source changes yet.)

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
Add @vercel/blob and probe-image-size dependencies

Prereqs for Spec A (Vercel Blob primitive + image-feature block).
See docs/superpowers/specs/2026-05-13-blob-and-image-feature-design.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: clean commit on `main`.

---

## Task 2: Create the blob-manifest Astro integration

**Files:**
- Create: `src/integrations/blob-manifest.ts`
- Create: `src/generated/blob-manifest.ts` (stub, gitignored)
- Modify: `.gitignore`

- [ ] **Step 1: Update `.gitignore` to ignore `src/generated/`**

Edit `.gitignore`. After the `# generated types` block (currently `dist/` and `.astro/`), append a new block:

```diff
 # build output
 dist/
 # generated types
 .astro/
+# generated source — regenerated by Astro integrations on every run
+src/generated/

 # dependencies
 node_modules/
```

- [ ] **Step 2: Create the integration file**

Create `src/integrations/blob-manifest.ts`:

```ts
import type { AstroIntegration } from 'astro';
import { list } from '@vercel/blob';
import probe from 'probe-image-size';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

interface BlobEntry {
  url: string;
  width: number | null;
  height: number | null;
}

const GENERATED_PATH = 'src/generated/blob-manifest.ts';

function inferContentType(pathname: string): string {
  const ext = pathname.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'svg':
      return 'image/svg+xml';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

async function buildManifest(): Promise<Record<string, BlobEntry>> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is not set. ' +
        'Pull it with `vercel env pull .env.local`, or add it to .env. ' +
        'Without it, the Vercel Blob manifest cannot be built.',
    );
  }

  const { blobs } = await list({ token });
  const manifest: Record<string, BlobEntry> = {};

  for (const blob of blobs) {
    const contentType = inferContentType(blob.pathname);
    const dims = await probeDims(blob.url, blob.pathname, contentType);
    manifest[blob.pathname] = {
      url: blob.url,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
    };
  }

  return manifest;
}

async function probeDims(
  url: string,
  key: string,
  contentType: string,
): Promise<{ width: number; height: number } | null> {
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

async function writeManifest(manifest: Record<string, BlobEntry>): Promise<void> {
  const sorted = Object.keys(manifest)
    .sort()
    .reduce<Record<string, BlobEntry>>((acc, k) => {
      acc[k] = manifest[k]!;
      return acc;
    }, {});

  const body = `// AUTO-GENERATED by src/integrations/blob-manifest.ts — do not edit.
// Regenerated at \`astro:config:setup\` on every dev/build/check run.
export const BLOB_MANIFEST = ${JSON.stringify(sorted, null, 2)} as const;
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
        logger.info(
          `Blob manifest written: ${Object.keys(manifest).length} entries.`,
        );
      },
    },
  };
}
```

Notes baked into this file:
- Keys are sorted before write — deterministic output.
- Empty blob store writes `{}` — succeeds, doesn't throw.
- SVG probe failure → warning + null dimensions. Raster probe failure → loud throw.
- `contentType` is inferred locally from the pathname extension (`@vercel/blob` v2's `list()` doesn't return contentType). It's only used inside `probeDims` for the SVG-fallback branch — never stored in the manifest.

- [ ] **Step 3: Seed the initial empty stub at `src/generated/blob-manifest.ts`**

This file is gitignored — we're seeding it locally so editor type-checking works before Astro runs. Astro will overwrite it the moment `pnpm dev` or `pnpm astro check` runs.

Create `src/generated/blob-manifest.ts`:

```ts
// AUTO-GENERATED by src/integrations/blob-manifest.ts — do not edit.
// Regenerated at `astro:config:setup` on every dev/build/check run.
export const BLOB_MANIFEST = {} as const;
export type BlobManifestKey = keyof typeof BLOB_MANIFEST;
```

- [ ] **Step 4: Verify the integration compiles**

Run: `pnpm astro check`
Expected: 0 errors, 0 warnings. The integration file is not yet wired into `astro.config.mjs`, so it isn't executed — but it should type-check on its own.

- [ ] **Step 5: Commit**

```bash
git add .gitignore src/integrations/blob-manifest.ts
git commit -m "$(cat <<'EOF'
Add blob-manifest Astro integration

Fetches Vercel Blob contents at astro:config:setup, probes dimensions
with probe-image-size, writes typed src/generated/blob-manifest.ts.
SVGs without intrinsic dims warn and record null dimensions; raster
probe failures throw loud. Missing BLOB_READ_WRITE_TOKEN throws with
the vercel env pull remediation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Note: the seeded `src/generated/blob-manifest.ts` is gitignored — it won't appear in the commit.

---

## Task 3: Wire the integration into `astro.config.mjs` + image remote patterns

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Edit `astro.config.mjs`**

Replace the file content with:

```js
// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import { blobManifest } from './src/integrations/blob-manifest.ts';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: vercel({
    imageService: true,
  }),
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  integrations: [mdx(), icon(), blobManifest()],
  vite: {
    plugins: [tailwindcss()],
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Geist',
      cssVariable: '--font-sans',
      weights: ['400', '500', '600', '700', '800', '900'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Geist Mono',
      cssVariable: '--font-mono',
      weights: ['400', '500', '700'],
    },
  ],
});
```

Changes from the previous file:
1. Imports `blobManifest` from `./src/integrations/blob-manifest.ts`.
2. Adds `image.remotePatterns` whitelisting `*.public.blob.vercel-storage.com` so Astro's image service can optimize remote Blob URLs.
3. Adds `blobManifest()` to the integrations array.

- [ ] **Step 2: Run the integration end-to-end to verify wiring**

Run: `pnpm astro check`

Expected output includes:
- `[blob-manifest] Building Blob manifest...`
- `[blob-manifest] Blob manifest written: 0 entries.` (or however many blobs are in the store)
- `0 errors, 0 warnings.`

If the integration errors out:
- `BLOB_READ_WRITE_TOKEN is not set` → re-run `vercel env pull .env.local` and verify `.env.local` has the token.
- Network error → check internet; check `@vercel/blob`'s install in `node_modules`.

If check passes, also verify the manifest file regenerated:

```bash
head -5 src/generated/blob-manifest.ts
```

Expected: starts with `// AUTO-GENERATED by src/integrations/blob-manifest.ts`.

- [ ] **Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "$(cat <<'EOF'
Wire blob-manifest integration and remote image patterns

Registers the hotrod-blob-manifest integration so the typed manifest
regenerates at astro:config:setup. Whitelists *.public.blob.vercel-storage.com
in image.remotePatterns so Astro's image service can optimize remote
Blob URLs in <Image> usage.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create the shared `blob-image-schema.ts`

**Files:**
- Create: `src/blocks/_shared/blob-image-schema.ts`

- [ ] **Step 1: Create the schema file**

Create `src/blocks/_shared/blob-image-schema.ts`:

```ts
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
```

Notes:
- Imports `BLOB_MANIFEST` from the generated file. The generated file always exists (Task 2 seeded the stub; Astro keeps it fresh).
- `suggestNearby` is a prefix-match — not a fuzzy search. Goal is "did you typo within the same folder?"
- Astro 6 ships Zod 4: `.refine(predicate, fnReturningParams)` is Zod-3 syntax and doesn't compile here. `.superRefine` is the Zod-4-compatible way to reference the bad input value inside the error message.
- Astro's `z` from `astro:content` is exported as a value, not a namespace, so `z.infer<typeof X>` doesn't resolve at type-check time. Hand-writing the `BlobImage` type is the established workaround for this codebase.

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm astro check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/blocks/_shared/blob-image-schema.ts
git commit -m "$(cat <<'EOF'
Add shared blob-image Zod schema

Strict { key, alt } schema with manifest-aware refinement. Missing key
fails loud with up to three near-match suggestions from the same folder.
Lives in src/blocks/_shared/ alongside button-schema.ts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Create the `<BlobImage>` component

**Files:**
- Create: `src/components/blob-image.astro`

- [ ] **Step 1: Create the component**

Create `src/components/blob-image.astro`:

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

const entry = BLOB_MANIFEST[image.key as keyof typeof BLOB_MANIFEST];
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

Notes:
- `priority` defaults `false`; image-feature is mid-page so it uses the default. The prop is exposed for future use by `heroImage`.
- The `throw` is defence-in-depth — the schema's refinement should catch unknown keys at content-load time. If a render-time call happens with bad props (programmatic misuse), the component throws loudly rather than rendering a broken image.
- The fallback `<img>` (SVG without intrinsic dims) skips Astro's image service entirely because Astro's `<Image>` requires explicit `width`/`height` for remote sources.

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm astro check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/components/blob-image.astro
git commit -m "$(cat <<'EOF'
Add <BlobImage> component

Wraps Astro <Image> from astro:assets with manifest-resolved dimensions
for remote Blob URLs. Falls back to plain <img> for SVGs without
intrinsic dimensions. Exposes a priority prop for future above-fold
images (heroImage etc).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Create the `image-feature` block schema

**Files:**
- Create: `src/blocks/image-feature/schema.ts`

- [ ] **Step 1: Create the schema file**

Create `src/blocks/image-feature/schema.ts`:

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

All five fields required. Stats min 1, max 4. Schema mirrors the convention from `figures/schema.ts` and `feature-strip/schema.ts`.

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm astro check`
Expected: 0 errors, 0 warnings. (The schema isn't registered yet, so no block instances exist that would exercise it.)

- [ ] **Step 3: Commit**

```bash
git add src/blocks/image-feature/schema.ts
git commit -m "$(cat <<'EOF'
Add image-feature block schema

Five required fields: heading, body, image (shared blobImageSchema),
badge, stats[1..4]. Path-qualified error messages mirror existing
block conventions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Create the `image-feature` block component

**Files:**
- Create: `src/blocks/image-feature/index.astro`

- [ ] **Step 1: Create the component**

Create `src/blocks/image-feature/index.astro`:

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

Notes:
- Hand-written Props type mirrors the convention from `figures/index.astro` and `hero/index.astro` — not `z.infer<typeof schema>`.
- No `<CheckerboardDivider />` — yellow-bg block, the divider rule says base layout + adjacent black-bg blocks handle the breaks.
- Semantic Tailwind tokens (`bg-background` = yellow, `bg-foreground` = black) come from the project's shadcn-style token system in `src/styles/global.css`.
- `border-l-0` on the content panel butts seamlessly against the image's right border.
- Gradient overlay is decorative (`aria-hidden="true"`).

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm astro check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/blocks/image-feature/index.astro
git commit -m "$(cat <<'EOF'
Add image-feature block component

Yellow-bg split composition: image on the left with a badge overlay and
decorative gradient; black content panel on the right with heading,
body, and a flex-wrap stats row. No checkerboard dividers (yellow-bg
rule). Hand-written Props type matches existing block convention.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Register `image-feature` in the block registry

**Files:**
- Modify: `src/blocks/registry.ts`

- [ ] **Step 1: Edit the registry**

Replace the contents of `src/blocks/registry.ts` with:

```ts
import { heroSchema } from './hero/schema';
import HeroComponent from './hero/index.astro';
import { figuresSchema } from './figures/schema';
import FiguresComponent from './figures/index.astro';
import { cardGridSchema } from './card-grid/schema';
import CardGridComponent from './card-grid/index.astro';
import { featureStripSchema } from './feature-strip/schema';
import FeatureStripComponent from './feature-strip/index.astro';
import { pricingSchema } from './pricing/schema';
import PricingComponent from './pricing/index.astro';
import { ctaBannerSchema } from './cta-banner/schema';
import CtaBannerComponent from './cta-banner/index.astro';
import { imageFeatureSchema } from './image-feature/schema';
import ImageFeatureComponent from './image-feature/index.astro';

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

export type BlockType = keyof typeof blockSchemas;
```

Changes from before: two new imports (`imageFeatureSchema`, `ImageFeatureComponent`) and one new entry in each of `blockSchemas` and `blockComponents`.

- [ ] **Step 2: Verify the discriminated union still resolves**

Run: `pnpm astro check`
Expected: 0 errors, 0 warnings. The discriminated union built by `buildBlocksField()` now includes `image-feature`.

- [ ] **Step 3: Commit**

```bash
git add src/blocks/registry.ts
git commit -m "$(cat <<'EOF'
Register image-feature block in the pagebuilder registry

Adds image-feature schema + component to the discriminated union.
MDX pages can now author { type: image-feature, ... } block instances.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Upload the seed image to Vercel Blob (user-run, manual)

**Files:** none (out-of-band action)

This step is manual — done via the Vercel dashboard, not the codebase. The image needs to exist in Blob storage before Task 10 references it in MDX, otherwise the build will fail with "key not found."

- [ ] **Step 1: Pick a source image**

Either:
- The driver-hand-on-steering-wheel photo from the design screenshots, OR
- The v0 reference: `https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=80` (yellow taxi cab on city street).

Either works visually. Recommend the one matching the screenshot since that's the validated design.

- [ ] **Step 2: Upload via the Vercel dashboard**

1. Open https://vercel.com/roboto-pro/hotrod
2. Storage tab → Blob store → "Add new" → "File upload"
3. Drag-and-drop the chosen image
4. **Set the pathname to `pages/index/legacy-driver.jpg`** (override the default filename). The pathname is the manifest key.
5. Set access: "Public" (so Astro Image can optimize the public URL).
6. Confirm upload.

- [ ] **Step 3: Refresh the local manifest**

Once the upload is complete, regenerate the local manifest by running the integration:

```bash
pnpm astro check
```

Expected output: `[blob-manifest] Blob manifest written: 1 entries.` (or more, if other blobs exist).

Then verify the key landed:

```bash
grep -F 'pages/index/legacy-driver.jpg' src/generated/blob-manifest.ts
```

Expected: a hit showing the URL, contentType, width, height.

No commit in this task — `src/generated/blob-manifest.ts` is gitignored.

---

## Task 10: Add the image-feature block instance to the homepage

**Files:**
- Modify: `src/content/pages/index.mdx`

- [ ] **Step 1: Insert the block at v0 position 5**

Edit `src/content/pages/index.mdx`. The current block order is: `hero`, `figures`, `card-grid`, `feature-strip`, `pricing`, `cta-banner`. Insert `image-feature` between `feature-strip` (currently the 4th block) and `pricing` (currently the 5th block).

Locate the end of the `feature-strip` block (the line `        description: "Average wait time under 5 minutes"`) and the start of the `pricing` block (`  - type: pricing`). Insert the new block between them.

```yaml
  - type: feature-strip
    title: "WHY CHOOSE US"
    items:
      - icon: clock
        title: "ALWAYS ON TIME"
        description: "Punctuality guaranteed or your ride is free"
      - icon: shield
        title: "100% SAFE"
        description: "Verified drivers and tracked rides"
      - icon: star
        title: "TOP RATED"
        description: "4.9 stars from 500K+ customers"
      - icon: zap
        title: "FAST PICKUP"
        description: "Average wait time under 5 minutes"
  - type: image-feature
    heading: "A LEGACY OF EXCELLENCE"
    body: "For over 35 years, HOTROD has been the heartbeat of city transportation. From our first yellow cab to a fleet of thousands, our commitment to getting you there safely has never wavered."
    image:
      key: "pages/index/legacy-driver.jpg"
      alt: "A driver's hand on the steering wheel at sunset, city lights blurred in the windscreen"
    badge: "SINCE 1987"
    stats:
      - value: "35+"
        label: "Years of Service"
      - value: "50M+"
        label: "Rides Completed"
      - value: "100+"
        label: "City Coverage"
  - type: pricing
    title: "SIMPLE PRICING"
    plans:
```

- [ ] **Step 2: Verify the schema validates the new block**

Run: `pnpm astro check`

Expected: 0 errors, 0 warnings. If the integration logs `Blob manifest written: 0 entries`, Task 9 hasn't been run yet — re-do that first.

If the check fails with "Image `key` 'pages/index/legacy-driver.jpg' was not found":
- The blob isn't in the manifest yet. Confirm Task 9 completed successfully (`grep` from Task 9 Step 3 should return a hit).
- Astro must run the integration freshly — re-run `pnpm astro check` after any blob change.

- [ ] **Step 3: Run a full build to confirm route generation**

Run: `pnpm build`

Expected:
- `[blob-manifest] Blob manifest written: N entries.`
- All routes prerender successfully, including `/`.
- No schema errors.

- [ ] **Step 4: Visual smoke in dev**

Run: `pnpm dev`

Open http://localhost:4321. Confirm:
1. The new block renders between `feature-strip` ("WHY CHOOSE US") and `pricing` ("SIMPLE PRICING").
2. Image renders on the left with the black border, gradient overlay, and "SINCE 1987" badge bottom-left.
3. Black content panel on the right with the heading "A LEGACY OF EXCELLENCE", body paragraph, and three stats (35+ / 50M+ / 100+).
4. No checkerboard dividers around the block (yellow-bg rule).
5. The image is served from `*.public.blob.vercel-storage.com` (check the network tab) and Astro's image service has optimized it (look for `/_image?...` URL in prod or a transformed local URL in dev).

Stop the dev server (`Ctrl+C`) once verified.

- [ ] **Step 5: Commit**

```bash
git add src/content/pages/index.mdx
git commit -m "$(cat <<'EOF'
Add image-feature block instance to homepage at v0 position 5

Restores the "A Legacy of Excellence" section from the v0 reference,
between feature-strip and pricing. References the seed image uploaded
manually to pages/index/legacy-driver.jpg in Vercel Blob.

Closes ROB-1990, ROB-1992, ROB-2000.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Push and verify production deploy

**Files:** none

- [ ] **Step 1: Push to main**

```bash
git push origin main
```

Expected: 9 commits push successfully (one per task with code changes, Tasks 9 had no commit).

- [ ] **Step 2: Watch the Vercel deploy**

Open https://vercel.com/roboto-pro/hotrod. The latest commit on `main` should be deploying.

Expected build log includes:
- `[blob-manifest] Building Blob manifest...`
- `[blob-manifest] Blob manifest written: 1 entries.` (or more)
- Successful build.

If the build fails with "BLOB_READ_WRITE_TOKEN is not set" — verify the env var exists in the Vercel project's Production environment.

- [ ] **Step 3: Smoke the production site**

Open https://hotrod.robotostudio.com. Scroll to position 5 (between WHY CHOOSE US and SIMPLE PRICING).

Confirm the same checklist as Task 10 Step 4, but on prod:
1. Block renders in the right place.
2. Image, gradient, badge, content panel, stats all visible.
3. No checkerboard dividers around the block.
4. Image served from `*.public.blob.vercel-storage.com` and optimized by Vercel's image service.

- [ ] **Step 4: Mark tickets Done in Linear**

Move ROB-1990, ROB-1992, and ROB-2000 to status "Done" via the Linear UI or MCP.

---

## Failure mode verification (manual, optional)

After the happy path lands, optionally verify the loud-failure modes are wired correctly by intentionally breaking things and confirming the error messages:

1. **Unknown blob key**: change `pages/index/legacy-driver.jpg` to `pages/index/typo.jpg` in `index.mdx`, run `pnpm astro check`. Expect: error naming the bad key, suggesting `pages/index/legacy-driver.jpg`.
2. **Empty alt**: change `alt: "..."` to `alt: ""`. Expect: `Image \`alt\` must not be empty.`
3. **Missing token**: temporarily comment out `BLOB_READ_WRITE_TOKEN` in `.env.local`, run `pnpm astro check`. Expect: integration throw with `vercel env pull` remediation.

Revert changes once verified. No commit.

---

## Done condition

- All 11 tasks completed and committed/pushed.
- Production deploy succeeds.
- Homepage shows the new block in the right position with the right content.
- ROB-1990, ROB-1992, ROB-2000 closed.

The shared `blobImageSchema` and `<BlobImage>` are now available for the Spec B work (Mux + video-feature block) and for future `heroImage` / `avatar` schema additions — both deferred as out-of-scope for this plan.
