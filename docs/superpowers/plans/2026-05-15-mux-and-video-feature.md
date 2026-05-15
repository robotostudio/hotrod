# Mux + video-feature block — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the Mux video primitive (shared `{ playbackId, title }` schema, `<MuxVideo>` component wrapping the `<mux-player>` web component, build-time manifest via Astro integration) plus the `video-feature` pagebuilder block, and place the first instance on the homepage at v0 position 6.

**Architecture:** An Astro integration runs at `astro:config:setup`, calls Mux's `assets.list({ limit: 100 })` via `@mux/mux-node`, walks each asset's playback IDs, keeps only `policy === 'public'` entries, and writes a typed `src/generated/mux-manifest.ts` keyed by playback ID. A shared Zod schema imports that file and refines `playbackId` against it. A `<MuxVideo>` Astro component reads the manifest entry, renders `<mux-player>` with an inline `aspect-ratio` style (from manifest metadata, defaulting to `16/9`) to prevent CLS, and registers the web component via a single client-side `<script>` import. The `video-feature` block uses the shared schema and renders a black-bg composition with two optional corner stat badges and a row of 2–4 icon tiles. House style: kebab-case files, strict Zod with path-qualified messages, semantic Tailwind tokens (`bg-foreground`, `bg-background`).

**Tech Stack:** Astro 6, MDX, Tailwind v4 (with shadcn-style token system), strict Zod via `astro:content`, `@mux/mux-node` (integration), `@mux/mux-player` (web component), `astro-icon` + `@iconify-json/lucide` (icons).

**Spec reference:** `docs/superpowers/specs/2026-05-15-mux-and-video-feature-design.md`.

**Verification model:** No test framework is configured (per project convention). Verification is `pnpm astro check` (types), `pnpm build` (route generation + schema validation), and visual smoke in `pnpm dev`. Each task ends with `pnpm astro check` and a commit.

**Tickets:** ROB-1991 (Mux video support — body to be updated to reference this spec), plus one new ticket for the `video-feature` block (to be filed at the start of Task 1 via the `writing-linear-tickets` skill).

---

## File structure overview

```
NEW
├── src/integrations/mux-manifest.ts            — Astro integration (fetch, index by playback ID, write)
├── src/generated/mux-manifest.ts               — typed, regenerated each run, gitignored (dir already ignored from Spec A)
├── src/blocks/_shared/mux-video-schema.ts      — shared { playbackId, title } Zod with manifest refinement
├── src/components/mux-video.astro              — <MuxVideo> wrapping <mux-player>
├── src/blocks/video-feature/schema.ts          — block schema
└── src/blocks/video-feature/index.astro        — block component

MODIFIED
├── astro.config.mjs                            — register integration
├── src/blocks/registry.ts                      — +1 entry for video-feature
├── src/content/pages/index.mdx                 — +1 block instance at v0 position 6
└── package.json + pnpm-lock.yaml               — +@mux/mux-node, +@mux/mux-player
```

Each file has one clear responsibility. The integration handles I/O; the generated file is pure data; the shared schema is validation only; the component is render only.

---

## Bootstrap note

The generated manifest file is gitignored (`src/generated/` was added to `.gitignore` by Spec A). On a fresh clone, the file doesn't exist until `astro dev`, `astro build`, or `astro check` runs the integration (which happens at `astro:config:setup`, before content loads). Task 2 seeds an empty stub locally so subsequent tasks' `pnpm astro check` runs succeed in editor-isolated environments. Astro overwrites it the moment any astro command runs.

---

## Task 1: Operational setup — file new ticket, refresh env, install dependencies

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

This is one-time setup. Steps 1–3 interact with external systems (Linear, Vercel) and must be run by the user (or in an authenticated session); the dep install + commit are automatable.

- [ ] **Step 1: File the new ticket for the `video-feature` block (user-run)**

Use the `writing-linear-tickets` skill at `~/dev/skills/skills/writing-linear-tickets/SKILL.md`. Create the ticket in the **Hotrod** Linear project. Title: "Add video-feature pagebuilder block". Body: short summary linking the spec at `docs/superpowers/specs/2026-05-15-mux-and-video-feature-design.md`, the block's role at v0 position 6, and that it depends on ROB-1991 (Mux primitive) shipping in the same plan.

Also update **ROB-1991**: replace the existing body with the canonical pointer to the spec. Use `save_issue` via the Linear MCP.

Expected: two ticket IDs in hand (the new one for the block + the refreshed ROB-1991). Capture both in the task notes — referenced in commit messages below.

- [ ] **Step 2: Confirm Vercel link is intact (user-run)**

```bash
ls .vercel/project.json
```

Expected: file exists (linked during Spec A). If missing, run `vercel link` and choose scope `roboto-pro`, project `hotrod`.

- [ ] **Step 3: Pull production env vars locally (user-run)**

```bash
vercel env pull .env.local --environment=production --yes
```

Expected: `.env.local` refreshed; contains at least `BLOB_READ_WRITE_TOKEN`, `MUX_TOKEN_ID`, and `MUX_TOKEN_SECRET`. Verify:

```bash
grep -E 'MUX_TOKEN_(ID|SECRET)' .env.local
```

Both lines should print. If `MUX_TOKEN_*` are missing, check the Vercel dashboard's Environment Variables panel for the `hotrod` project and add them before retrying.

- [ ] **Step 4: Install dependencies**

```bash
pnpm add @mux/mux-node @mux/mux-player
```

`@mux/mux-node` ships with TypeScript types in the package — no separate `@types/` dependency needed. `@mux/mux-player` ships the web component (custom element registration handled at import time).

Verify:

```bash
pnpm list @mux/mux-node @mux/mux-player
```

Expected: both packages listed with resolved versions.

- [ ] **Step 5: Verify type check still passes on the clean tree**

Run: `pnpm astro check`

Expected: 0 errors, 0 warnings. (No source changes yet.)

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
Add @mux/mux-node and @mux/mux-player dependencies

Prereqs for Spec B (Mux video primitive + video-feature block).
See docs/superpowers/specs/2026-05-15-mux-and-video-feature-design.md.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: clean commit on `main`.

---

## Task 2: Create the mux-manifest Astro integration

**Files:**
- Create: `src/integrations/mux-manifest.ts`
- Create: `src/generated/mux-manifest.ts` (stub, gitignored)

`.gitignore` already excludes `src/generated/` (added by Spec A). No `.gitignore` edit needed.

- [ ] **Step 1: Create the integration file**

Create `src/integrations/mux-manifest.ts`:

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
        'Pull them with `vercel env pull .env.local --environment=production --yes` from the linked repo. ' +
        'Without them, the Mux manifest cannot be built.',
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

async function writeManifest(manifest: Record<string, MuxEntry>): Promise<void> {
  const sorted = Object.keys(manifest)
    .sort()
    .reduce<Record<string, MuxEntry>>((acc, k) => {
      acc[k] = manifest[k]!;
      return acc;
    }, {});

  const body = `// AUTO-GENERATED by src/integrations/mux-manifest.ts — do not edit.
// Regenerated at \`astro:config:setup\` on every dev/build/check run.
export const MUX_MANIFEST = ${JSON.stringify(sorted, null, 2)} as const;
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
        logger.info(
          `Mux manifest written: ${Object.keys(manifest).length} public playback IDs.`,
        );
      },
    },
  };
}
```

Notes baked into this file:
- Keys (playback IDs) are sorted before write — deterministic output for clean diffs even though the file is gitignored.
- Empty Mux environment writes `{}` — succeeds, doesn't throw.
- Signed playback IDs are silently skipped (filtered by `policy !== 'public'`).
- Hitting the 100-asset page limit logs a console warning; v1 doesn't paginate.

- [ ] **Step 2: Seed the initial empty stub at `src/generated/mux-manifest.ts`**

This file is gitignored — we're seeding it locally so editor type-checking works before Astro runs. Astro will overwrite it the moment `pnpm dev` or `pnpm astro check` runs.

Create `src/generated/mux-manifest.ts`:

```ts
// AUTO-GENERATED by src/integrations/mux-manifest.ts — do not edit.
// Regenerated at `astro:config:setup` on every dev/build/check run.
export const MUX_MANIFEST = {} as const;
export type MuxManifestKey = keyof typeof MUX_MANIFEST;
```

- [ ] **Step 3: Verify the integration compiles**

Run: `pnpm astro check`

Expected: 0 errors, 0 warnings. The integration file is not yet wired into `astro.config.mjs`, so it isn't executed — but it should type-check on its own.

- [ ] **Step 4: Commit**

```bash
git add src/integrations/mux-manifest.ts
git commit -m "$(cat <<'EOF'
Add mux-manifest Astro integration

Calls Mux assets.list at astro:config:setup, walks each asset's
playback_ids, keeps only public-policy IDs, writes typed
src/generated/mux-manifest.ts keyed by playback ID. Missing tokens
throw with the vercel env pull remediation. 100-asset page hit logs
a console warning; pagination is not implemented in v1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Note: the seeded `src/generated/mux-manifest.ts` is gitignored — it won't appear in the commit.

---

## Task 3: Wire the integration into `astro.config.mjs`

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Read the current `astro.config.mjs`**

Read the file. After Spec A, it imports `blobManifest` and includes it in the `integrations` array, plus has `image.remotePatterns` set for Vercel Blob hosts. The change for Spec B is purely additive: import `muxManifest` and slot it into the same array.

- [ ] **Step 2: Edit `astro.config.mjs`**

Add a new import line below the existing `blobManifest` import:

```diff
 import { blobManifest } from './src/integrations/blob-manifest.ts';
+import { muxManifest } from './src/integrations/mux-manifest.ts';
```

And add `muxManifest()` to the `integrations` array, after `blobManifest()`:

```diff
-  integrations: [mdx(), icon(), blobManifest()],
+  integrations: [mdx(), icon(), blobManifest(), muxManifest()],
```

No `image.remotePatterns` change — Mux serves video directly through `<mux-player>`, not Astro's `<Image>`.

- [ ] **Step 3: Run the integration end-to-end to verify wiring**

Run: `pnpm astro check`

Expected output includes:
- `[blob-manifest] Building Blob manifest...` (still works)
- `[mux-manifest] Building Mux manifest...`
- `[mux-manifest] Mux manifest written: N public playback IDs.` (N may be 0 if no public assets yet)
- `0 errors, 0 warnings.`

If the integration errors out:
- `MUX_TOKEN_ID and MUX_TOKEN_SECRET must both be set` → re-run `vercel env pull .env.local --environment=production --yes` and verify both keys are present.
- Mux API auth error → check the Mux dashboard's Access Tokens panel; the token may have been revoked or scoped without `read` permission on Video.
- Network error → check internet; check `@mux/mux-node`'s install in `node_modules`.

If check passes, verify the manifest file regenerated:

```bash
head -5 src/generated/mux-manifest.ts
```

Expected: starts with `// AUTO-GENERATED by src/integrations/mux-manifest.ts`.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs
git commit -m "$(cat <<'EOF'
Wire mux-manifest integration into astro.config.mjs

Registers hotrod-mux-manifest alongside hotrod-blob-manifest so both
typed manifests regenerate at astro:config:setup. No image.remotePatterns
change — Mux serves video directly through <mux-player>, not Astro's
<Image>.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create the shared `mux-video-schema.ts`

**Files:**
- Create: `src/blocks/_shared/mux-video-schema.ts`

- [ ] **Step 1: Create the schema file**

Create `src/blocks/_shared/mux-video-schema.ts`:

```ts
import { z } from 'astro:content';
import { MUX_MANIFEST } from '../../generated/mux-manifest';

function suggestNearby(badId: string): string {
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
```

Notes:
- Imports `MUX_MANIFEST` from the generated file. The generated file always exists (Task 2 seeded the stub; Astro keeps it fresh).
- `suggestNearby` returns the first three known playback IDs — playback IDs are opaque random strings, so prefix matching adds no value. The hint exists only so the message is non-empty when the manifest has content.
- Astro 6 ships Zod 4: `.refine(predicate, fnReturningParams)` is Zod-3 syntax and doesn't compile here. `.superRefine` is the Zod-4-compatible way to reference the bad input value inside the error message.
- Astro's `z` from `astro:content` is exported as a value, not a namespace, so `z.infer<typeof X>` doesn't resolve at type-check time. Hand-writing the `MuxVideo` type is the established workaround for this codebase.

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm astro check`

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/blocks/_shared/mux-video-schema.ts
git commit -m "$(cat <<'EOF'
Add shared mux-video Zod schema

Strict { playbackId, title } schema with manifest-aware refinement.
Missing playback ID fails loud with up to three known IDs as a hint.
Signed playback policies are rejected (the manifest only contains
public IDs). Lives in src/blocks/_shared/ alongside blob-image-schema.ts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Create the `<MuxVideo>` component

**Files:**
- Create: `src/components/mux-video.astro`

- [ ] **Step 1: Create the component**

Create `src/components/mux-video.astro`:

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
const aspectCss = aspect.replace(':', '/');
---
<mux-player
  playback-id={video.playbackId}
  metadata-video-title={video.title}
  stream-type="on-demand"
  style={`--media-object-fit: cover; aspect-ratio: ${aspectCss};`}
  class={className}
></mux-player>

<script>
  import '@mux/mux-player';
</script>
```

Notes:
- The `<script>` tag without `is:inline` is bundled and hoisted by Astro across pages that use this component — the web-component registration runs once per page load.
- `style` uses inline CSS rather than Tailwind classes for `aspect-ratio` because the value is dynamic (read from the manifest).
- `stream-type="on-demand"` is hardcoded; live streaming is out of scope for v1.
- No autoplay, no muted, no loop — defaults are deliberate and documented in the spec.

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm astro check`

Expected: 0 errors, 0 warnings. The `<mux-player>` custom element is unknown to TypeScript's JSX-namespace by default, but Astro's templating is lenient about unknown elements (treats them as standard HTML). If `astro check` complains, double-check the import path of `MUX_MANIFEST` and the destructuring of `Astro.props`.

- [ ] **Step 3: Commit**

```bash
git add src/components/mux-video.astro
git commit -m "$(cat <<'EOF'
Add <MuxVideo> component wrapping <mux-player>

Reads the manifest entry for the playback ID, emits <mux-player> with
inline aspect-ratio style for CLS prevention, and registers the web
component via a single Astro <script> import. Defaults: on-demand
stream type, default controls, no autoplay, no muted, no loop.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Create the `video-feature` block schema

**Files:**
- Create: `src/blocks/video-feature/schema.ts`

- [ ] **Step 1: Create the schema file**

Create `src/blocks/video-feature/schema.ts`:

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

Notes:
- `badges` has no `.min()` — empty array is allowed (the block renders the video without corner overlays).
- `tiles` is `.min(2).max(4)` — bracketing the v0 design's flexibility range.
- Top-level field naming (`heading`, `body`) mirrors `image-feature` for consistency.

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm astro check`

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/blocks/video-feature/schema.ts
git commit -m "$(cat <<'EOF'
Add video-feature block schema

Strict object with heading, body, video (muxVideoSchema), badges
(array, 0-2), and tiles (array, 2-4). Field naming mirrors
image-feature for consistency.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Create the `video-feature` block component

**Files:**
- Create: `src/blocks/video-feature/index.astro`

- [ ] **Step 1: Create the component**

Create `src/blocks/video-feature/index.astro`:

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
- Black-bg block → owns checkerboard dividers at the top + bottom of its own markup (project rule).
- Yellow border around the video uses `border-8 border-background` — on this black-bg section, `bg-background` resolves to yellow.
- Corner badges are `hidden md:block`: on mobile they overhang the viewport edge and look bad. Acceptable since they're decorative.
- Tile grid: `grid-cols-2` on mobile (always), responsive on `md:` based on `tiles.length`.
- Icons resolve via `astro-icon` + `@iconify-json/lucide`, matching the existing convention (`<Icon name="lucide:zap" />`).

- [ ] **Step 2: Verify it type-checks**

Run: `pnpm astro check`

Expected: 0 errors, 0 warnings.

- [ ] **Step 3: Commit**

```bash
git add src/blocks/video-feature/index.astro
git commit -m "$(cat <<'EOF'
Add video-feature block component

Black-bg composition: centered heading + lede, video panel with thick
yellow border, two optional corner stat badges (top-left, bottom-right),
and 2-4 icon tiles below. Emits checkerboard dividers top + bottom
(black-bg rule). Corner badges hide on mobile to avoid viewport overhang.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Register video-feature in the block registry

**Files:**
- Modify: `src/blocks/registry.ts`

- [ ] **Step 1: Read the current `registry.ts`**

Confirm the current shape — two const maps (`blockSchemas` and `blockComponents`), each keyed by block type, with seven existing entries after Spec A landed (`hero`, `figures`, `card-grid`, `feature-strip`, `pricing`, `cta-banner`, `image-feature`).

- [ ] **Step 2: Edit `registry.ts`**

Add two new imports near the existing block imports:

```ts
import { videoFeatureSchema } from './video-feature/schema';
import VideoFeatureComponent from './video-feature/index.astro';
```

Then add the new entries to both maps, after `'image-feature'`:

```diff
 export const blockSchemas = {
   hero: heroSchema,
   figures: figuresSchema,
   'card-grid': cardGridSchema,
   'feature-strip': featureStripSchema,
   pricing: pricingSchema,
   'cta-banner': ctaBannerSchema,
   'image-feature': imageFeatureSchema,
+  'video-feature': videoFeatureSchema,
 } as const;

 export const blockComponents = {
   hero: HeroComponent,
   figures: FiguresComponent,
   'card-grid': CardGridComponent,
   'feature-strip': FeatureStripComponent,
   pricing: PricingComponent,
   'cta-banner': CtaBannerComponent,
   'image-feature': ImageFeatureComponent,
+  'video-feature': VideoFeatureComponent,
 } satisfies Record<keyof typeof blockSchemas, unknown>;
```

The `satisfies` clause on `blockComponents` ensures the keys stay in sync with `blockSchemas` — type-check will fail if you forget to add one or the other.

- [ ] **Step 3: Verify it type-checks**

Run: `pnpm astro check`

Expected: 0 errors, 0 warnings.

- [ ] **Step 4: Commit**

```bash
git add src/blocks/registry.ts
git commit -m "$(cat <<'EOF'
Register video-feature block in the pagebuilder registry

Adds video-feature to both blockSchemas and blockComponents maps.
satisfies clause ensures the two stay in lockstep.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Upload the seed Mux video and add the block instance to the homepage

**Files:**
- Modify: `src/content/pages/index.mdx`

- [ ] **Step 1: Upload a short demo video to Mux (user-run)**

Open the Mux dashboard for the environment whose `MUX_TOKEN_ID` is in `.env.local`. Upload one short video (≤30 seconds, MP4 or MOV) via the Assets → New Upload UI. Set playback policy to **Public** (not Signed).

Wait for the asset to reach status `ready`. Copy the **Playback ID** (long opaque string, distinct from the asset ID). Note it for Step 3.

If no short demo footage is available, any visually-acceptable placeholder works — the spec accepts that the homepage will need a better video later. The content of the asset is not part of this plan's success criteria; the wiring is.

- [ ] **Step 2: Re-run the integration so the new playback ID enters the manifest**

```bash
pnpm astro check
```

Expected: integration logs `Mux manifest written: N public playback IDs.` with `N` ≥ 1. Verify the new playback ID is present:

```bash
grep -o '"[A-Za-z0-9]*"' src/generated/mux-manifest.ts | head -10
```

The new playback ID should appear in the output.

- [ ] **Step 3: Edit `src/content/pages/index.mdx`**

Read the file. Locate the `image-feature` block (currently at position 5, between `feature-strip` and `pricing`). Insert the new `video-feature` block immediately after `image-feature` and before `pricing`:

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

Replace `REPLACE_WITH_REAL_PLAYBACK_ID` with the actual playback ID from Step 1.

YAML indentation must match the existing blocks in the file (two spaces under `blocks:`). Match the quoting style of the existing `image-feature` block (double-quoted strings throughout).

- [ ] **Step 4: Verify it type-checks**

Run: `pnpm astro check`

Expected: 0 errors, 0 warnings. If the Zod refinement throws "Playback ID … was not found," the manifest is stale — re-run Step 2 to regenerate it, then re-run check.

- [ ] **Step 5: Verify the production build passes**

Run: `pnpm build`

Expected: build succeeds. The homepage route emits with the new block. No "missing playback ID" errors, no "tiles must contain at least two" errors.

- [ ] **Step 6: Commit**

```bash
git add src/content/pages/index.mdx
git commit -m "$(cat <<'EOF'
Add video-feature block instance to homepage at v0 position 6

Slots in between image-feature (position 5) and pricing. Heading
"SEE US IN ACTION", with two corner badges and four icon tiles. Seed
playback ID points at the uploaded Mux demo.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Visual smoke + failure-case verification

**Files:** (no edits — verification only)

- [ ] **Step 1: Run the dev server**

```bash
pnpm dev
```

Expected: server starts on the default port (typically `http://localhost:4321`). Integration logs print as before.

- [ ] **Step 2: Open `/` and confirm the visual**

Open `http://localhost:4321/` in a browser. Scroll to position 6 (between the yellow `image-feature` block and the `pricing` block). Confirm:

- Section background is black (foreground token).
- Checkerboard dividers visible above and below the section.
- Centered "SEE US IN ACTION" heading and lede in the white-on-black palette.
- Video panel renders with a thick yellow border (16:9 aspect, no layout shift).
- Mux player controls appear on hover.
- Clicking play streams the video; audio plays unless the user has system-muted.
- On desktop width: two corner badges visible at the top-left and bottom-right of the video panel.
- On mobile width (DevTools responsive mode ≤768px): badges are hidden; everything else still renders.
- Four icon tiles in a row below the video on desktop; two columns on mobile. Lucide icons resolve.

- [ ] **Step 3: Failure-case A — missing playback ID**

In `src/content/pages/index.mdx`, temporarily edit the `playbackId` value to a clearly-bad string (e.g. `"BROKEN_TEST"`). Save.

Run: `pnpm astro check`

Expected: type check fails with a Zod error naming `"BROKEN_TEST"` and listing the known playback IDs as the hint. No silent fallback, no rendered broken player.

Revert the file to the real playback ID. Re-run `pnpm astro check`. Expected: 0 errors.

- [ ] **Step 4: Failure-case B — missing Mux tokens**

Temporarily comment out `MUX_TOKEN_SECRET` in `.env.local`.

Run: `pnpm astro check`

Expected: the integration throws at `astro:config:setup` with the "Pull them with `vercel env pull .env.local --environment=production --yes`" message.

Restore `MUX_TOKEN_SECRET` in `.env.local`. Re-run `pnpm astro check`. Expected: 0 errors.

- [ ] **Step 5: Push and confirm the Vercel preview**

```bash
git push origin main
```

Expected: Vercel auto-deploys. Watch the deploy logs in the Vercel dashboard — the integration runs in the build environment, the manifest writes, the build emits, and the production URL updates.

Visit `https://hotrod.robotostudio.com/` after the deploy completes. Scroll to position 6 and confirm the same visual as Step 2. The Mux player should play the same video.

If the Vercel build fails with `MUX_TOKEN_ID and MUX_TOKEN_SECRET must both be set`, the build environment is missing the keys despite `.env.local` being correct locally — verify both keys are present in the Vercel project's environment variables panel for the Production scope.

- [ ] **Step 6: Mark the Linear tickets done**

In Linear: update ROB-1991 to status **Done**. Update the new `video-feature` ticket (created in Task 1) to status **Done**. Add a short comment on each linking the merge commit(s).

---

## Done criteria

- `pnpm astro check` passes with 0 errors / 0 warnings.
- `pnpm build` succeeds.
- The Vercel production deploy at `https://hotrod.robotostudio.com/` shows the `video-feature` block at position 6 with the heading "SEE US IN ACTION", a playable Mux video framed in yellow, two corner badges (desktop), and four Lucide-iconed tiles below.
- Both Linear tickets (ROB-1991 + the new block ticket) are in **Done**.
- The two failure modes (missing playback ID, missing Mux tokens) have been manually verified to surface loud errors and have been restored to working state.
