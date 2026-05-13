# Pagebuilder framework implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a frontmatter-driven block-composition system to the `pages` content collection, with six placeholder blocks ready for the block tickets (ROB-1983 – ROB-1988) to flesh out.

**Architecture:** Per-block folders under `src/blocks/<name>/` each export a Zod `schema.ts` and an Astro `index.astro`. A single `registry.ts` collects them into `blockSchemas` and `blockComponents` maps. A `buildBlocksField()` helper wraps the schemas in a discriminated-union Zod array that the `pages` collection consumes. `src/pages/[...slug].astro` branches on `blocks` presence: present → `<BaseLayout>` + `<PageSections>` + dispatch; absent → existing `<PageLayout>` + MDX body.

**Tech Stack:** Astro 6 (content collections, MDX), Zod, Tailwind v4. No test framework — verification is `pnpm astro check` + `pnpm build` + manual smoke.

**Linear ticket:** ROB-1993. **Spec:** `docs/superpowers/specs/2026-05-13-pagebuilder-framework-design.md`.

---

## File map

- Create: `src/blocks/hero/schema.ts`, `src/blocks/hero/index.astro`
- Create: `src/blocks/figures/schema.ts`, `src/blocks/figures/index.astro`
- Create: `src/blocks/card-grid/schema.ts`, `src/blocks/card-grid/index.astro`
- Create: `src/blocks/feature-strip/schema.ts`, `src/blocks/feature-strip/index.astro`
- Create: `src/blocks/pricing/schema.ts`, `src/blocks/pricing/index.astro`
- Create: `src/blocks/cta-banner/schema.ts`, `src/blocks/cta-banner/index.astro`
- Create: `src/blocks/registry.ts`
- Create: `src/blocks/build-blocks-field.ts`
- Create: `src/components/page-sections.astro`
- Modify: `src/content.config.ts` — add optional `blocks` field on `pages`
- Modify: `src/pages/[...slug].astro` — branch on `blocks` presence

---

## Task 1: Create the six block stubs

**Files (all create):**
- `src/blocks/hero/schema.ts`
- `src/blocks/hero/index.astro`
- `src/blocks/figures/schema.ts`
- `src/blocks/figures/index.astro`
- `src/blocks/card-grid/schema.ts`
- `src/blocks/card-grid/index.astro`
- `src/blocks/feature-strip/schema.ts`
- `src/blocks/feature-strip/index.astro`
- `src/blocks/pricing/schema.ts`
- `src/blocks/pricing/index.astro`
- `src/blocks/cta-banner/schema.ts`
- `src/blocks/cta-banner/index.astro`

Each block ships with a minimal schema (just the `type` literal) and a placeholder Astro component. Each block ticket (ROB-1983 – ROB-1988) will later replace both halves.

- [ ] **Step 1: Create `src/blocks/hero/schema.ts`**

```ts
import { z } from 'astro:content';

export const heroSchema = z
  .object({
    type: z.literal('hero'),
  })
  .strict();

export type HeroBlock = z.infer<typeof heroSchema>;
```

- [ ] **Step 2: Create `src/blocks/hero/index.astro`**

```astro
---
import type { HeroBlock } from './schema';

type Props = HeroBlock;
---
<section data-block-stub="hero" class="border border-dashed border-foreground/30 px-6 py-8 text-sm">
  hero (placeholder)
</section>
```

- [ ] **Step 3: Repeat for `figures`**

Create `src/blocks/figures/schema.ts`:

```ts
import { z } from 'astro:content';

export const figuresSchema = z
  .object({
    type: z.literal('figures'),
  })
  .strict();

export type FiguresBlock = z.infer<typeof figuresSchema>;
```

Create `src/blocks/figures/index.astro`:

```astro
---
import type { FiguresBlock } from './schema';

type Props = FiguresBlock;
---
<section data-block-stub="figures" class="border border-dashed border-foreground/30 px-6 py-8 text-sm">
  figures (placeholder)
</section>
```

- [ ] **Step 4: Repeat for `card-grid`**

Create `src/blocks/card-grid/schema.ts`:

```ts
import { z } from 'astro:content';

export const cardGridSchema = z
  .object({
    type: z.literal('card-grid'),
  })
  .strict();

export type CardGridBlock = z.infer<typeof cardGridSchema>;
```

Create `src/blocks/card-grid/index.astro`:

```astro
---
import type { CardGridBlock } from './schema';

type Props = CardGridBlock;
---
<section data-block-stub="card-grid" class="border border-dashed border-foreground/30 px-6 py-8 text-sm">
  card-grid (placeholder)
</section>
```

- [ ] **Step 5: Repeat for `feature-strip`**

Create `src/blocks/feature-strip/schema.ts`:

```ts
import { z } from 'astro:content';

export const featureStripSchema = z
  .object({
    type: z.literal('feature-strip'),
  })
  .strict();

export type FeatureStripBlock = z.infer<typeof featureStripSchema>;
```

Create `src/blocks/feature-strip/index.astro`:

```astro
---
import type { FeatureStripBlock } from './schema';

type Props = FeatureStripBlock;
---
<section data-block-stub="feature-strip" class="border border-dashed border-foreground/30 px-6 py-8 text-sm">
  feature-strip (placeholder)
</section>
```

- [ ] **Step 6: Repeat for `pricing`**

Create `src/blocks/pricing/schema.ts`:

```ts
import { z } from 'astro:content';

export const pricingSchema = z
  .object({
    type: z.literal('pricing'),
  })
  .strict();

export type PricingBlock = z.infer<typeof pricingSchema>;
```

Create `src/blocks/pricing/index.astro`:

```astro
---
import type { PricingBlock } from './schema';

type Props = PricingBlock;
---
<section data-block-stub="pricing" class="border border-dashed border-foreground/30 px-6 py-8 text-sm">
  pricing (placeholder)
</section>
```

- [ ] **Step 7: Repeat for `cta-banner`**

Create `src/blocks/cta-banner/schema.ts`:

```ts
import { z } from 'astro:content';

export const ctaBannerSchema = z
  .object({
    type: z.literal('cta-banner'),
  })
  .strict();

export type CtaBannerBlock = z.infer<typeof ctaBannerSchema>;
```

Create `src/blocks/cta-banner/index.astro`:

```astro
---
import type { CtaBannerBlock } from './schema';

type Props = CtaBannerBlock;
---
<section data-block-stub="cta-banner" class="border border-dashed border-foreground/30 px-6 py-8 text-sm">
  cta-banner (placeholder)
</section>
```

- [ ] **Step 8: Commit**

```bash
git add src/blocks/
git commit -m "Scaffold six block stubs (hero, figures, card-grid, feature-strip, pricing, cta-banner)

Each block exports a strict Zod schema with just the type literal and a
placeholder Astro component. Each block ticket (ROB-1983 – ROB-1988)
will replace both halves.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Build the registry

**Files:**
- Create: `src/blocks/registry.ts`

Single site of truth that the renderer and the schema-helper both consume.

- [ ] **Step 1: Create `src/blocks/registry.ts`**

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

export const blockSchemas = {
  hero: heroSchema,
  figures: figuresSchema,
  'card-grid': cardGridSchema,
  'feature-strip': featureStripSchema,
  pricing: pricingSchema,
  'cta-banner': ctaBannerSchema,
} as const;

export const blockComponents = {
  hero: HeroComponent,
  figures: FiguresComponent,
  'card-grid': CardGridComponent,
  'feature-strip': FeatureStripComponent,
  pricing: PricingComponent,
  'cta-banner': CtaBannerComponent,
} satisfies Record<keyof typeof blockSchemas, unknown>;

export type BlockType = keyof typeof blockSchemas;
```

The `satisfies` clause keeps the two maps in lockstep: TypeScript fails the build if a key in `blockSchemas` is missing from `blockComponents` or vice versa.

- [ ] **Step 2: Run `pnpm astro check` to confirm imports resolve**

Run: `pnpm astro check`
Expected: PASS (or the same warnings/errors that existed before this task — no new ones).

- [ ] **Step 3: Commit**

```bash
git add src/blocks/registry.ts
git commit -m "Add block registry (schemas + components)

Single import site for the six pagebuilder block stubs. Pairs each
schema with its component and uses a satisfies clause to keep the two
maps in lockstep.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Build `buildBlocksField()` helper

**Files:**
- Create: `src/blocks/build-blocks-field.ts`

Returns the discriminated-union Zod schema that consuming collections drop into their schema object.

- [ ] **Step 1: Create `src/blocks/build-blocks-field.ts`**

```ts
import { z } from 'astro:content';
import { blockSchemas } from './registry';

const schemaList = Object.values(blockSchemas) as unknown as [
  (typeof blockSchemas)[keyof typeof blockSchemas],
  ...Array<(typeof blockSchemas)[keyof typeof blockSchemas]>,
];

export function buildBlocksField() {
  return z.array(z.discriminatedUnion('type', schemaList)).optional();
}
```

The double cast is needed because `z.discriminatedUnion` wants a non-empty tuple type, and `Object.values` returns a plain array. We've got six members; the cast is sound.

- [ ] **Step 2: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: PASS (no new errors).

- [ ] **Step 3: Commit**

```bash
git add src/blocks/build-blocks-field.ts
git commit -m "Add buildBlocksField() helper

Returns an optional Zod array over the discriminated union of registered
block schemas. The single import any collection needs to opt into the
pagebuilder.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Create `<PageSections>` wrapper

**Files:**
- Create: `src/components/page-sections.astro`

Thin vertical-rhythm wrapper. No width, no padding, no per-block fullBleed flag — each block component handles its own width and background.

- [ ] **Step 1: Create `src/components/page-sections.astro`**

```astro
---
// PageSections is the single source of inter-block layout.
// It only provides vertical rhythm; each block handles its own width
// and background internally.
---
<div class="flex flex-col">
  <slot />
</div>
```

The empty `flex flex-col` is deliberate: block-internal `py-*` controls spacing for now. If a real gap is wanted later, change it here once.

- [ ] **Step 2: Commit**

```bash
git add src/components/page-sections.astro
git commit -m "Add <PageSections> wrapper

Thin vertical-rhythm wrapper for block-composed pages. Owns inter-block
layout; each block handles its own width and background.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Wire `blocks` field into the `pages` collection

**Files:**
- Modify: `src/content.config.ts` — add `blocks: buildBlocksField()` to the `pages` schema.

- [ ] **Step 1: Edit `src/content.config.ts`**

At the top of the file, add the import (below the existing imports):

```ts
import { buildBlocksField } from './blocks/build-blocks-field';
```

Then add `blocks: buildBlocksField(),` to the `pages` schema, after the existing `draft` field:

```ts
const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z
    .object({
      title: requiredString('title'),
      description: requiredString('description'),
      publishedAt: z.coerce.date({ message: dateMessage('publishedAt') }),
      updatedAt: z.coerce.date({ message: dateMessage('updatedAt') }).optional(),
      draft: z.boolean().default(false),
      blocks: buildBlocksField(),
    })
    .strict(),
});
```

`blog` and `authors` schemas remain unchanged.

- [ ] **Step 2: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: PASS. Existing pages have no `blocks` field, which is allowed because the field is optional.

- [ ] **Step 3: Run `pnpm build`**

Run: `pnpm build`
Expected: PASS. All routes generate. Existing pages render via the MDX-body path (the dispatcher change comes in Task 6, but the schema change alone shouldn't break anything because `blocks` is optional and nothing reads it yet).

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts
git commit -m "Add optional blocks field to pages collection

Wires buildBlocksField() into the pages schema. Existing body-only
pages keep working (blocks is optional). Renderer changes land next.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Branch the dispatch in `[...slug].astro`

**Files:**
- Modify: `src/pages/[...slug].astro` — replace the whole file.

When `blocks` is set, render `<BaseLayout>` + `<PageSections>` + dispatched blocks. When `blocks` is absent, fall through to the existing `<PageLayout>` + MDX-body path.

- [ ] **Step 1: Replace `src/pages/[...slug].astro`**

```astro
---
import BaseLayout from '../layouts/base-layout.astro';
import PageLayout from '../layouts/page-layout.astro';
import PageSections from '../components/page-sections.astro';
import { blockComponents } from '../blocks/registry';
import { getPublishedPages } from '../lib/content';
import { render } from 'astro:content';

export async function getStaticPaths() {
  const pages = await getPublishedPages();
  return pages.map((entry) => ({
    params: { slug: entry.id === 'index' ? undefined : entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { title, description, publishedAt, updatedAt, blocks } = entry.data;
const { Content } = await render(entry);
---

{
  blocks ? (
    <BaseLayout
      title={title}
      description={description}
      publishedAt={publishedAt}
      updatedAt={updatedAt}
    >
      <PageSections>
        {blocks.map((block) => {
          const Component = blockComponents[block.type];
          return <Component {...block} />;
        })}
      </PageSections>
    </BaseLayout>
  ) : (
    <PageLayout
      title={title}
      description={description}
      publishedAt={publishedAt}
      updatedAt={updatedAt}
    >
      <Content />
    </PageLayout>
  )
}
```

Notes for the engineer:
- `blockComponents[block.type]` is a total lookup — every literal in the union has a matching entry, enforced by the `satisfies` clause in `registry.ts`.
- `{...block}` spreads the validated block as props. Each block's `Props = <Name>Block`, so TypeScript narrows correctly.
- When `blocks` is set, **no auto-h1** is rendered. The hero block will own the visible H1 once its real markup ships.
- `title` / `description` always drive `<head>` via `<BaseLayout>` / `<PageLayout>`.

- [ ] **Step 2: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: PASS.

If you hit a TypeScript narrowing error on `<Component {...block} />` (Astro sometimes can't narrow the spread across a generic component reference), use a type cast: `const Component = blockComponents[block.type] as never;`. Document the cast with a brief comment if used.

- [ ] **Step 3: Run `pnpm build`**

Run: `pnpm build`
Expected: PASS. All existing pages (`/`, `/about`, `/services/astro`) still build — they fall through to the body-only branch.

- [ ] **Step 4: Commit**

```bash
git add src/pages/[...slug].astro
git commit -m "Branch [...slug].astro on blocks presence

When blocks is set, render BaseLayout + PageSections + dispatched
block components. When absent, keep the existing PageLayout + MDX body
path so existing pages render unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Smoke-test the blocks path with a temporary page

**Files:**
- Create (then delete): `src/content/pages/_blocks-smoke.mdx`

Confirms the renderer dispatches every block. The page is not committed.

- [ ] **Step 1: Create `src/content/pages/_blocks-smoke.mdx`**

```mdx
---
title: "Blocks smoke"
description: "Temporary smoke page for the pagebuilder framework."
publishedAt: 2026-05-13
draft: true
blocks:
  - type: hero
  - type: figures
  - type: card-grid
  - type: feature-strip
  - type: pricing
  - type: cta-banner
---
```

`draft: true` keeps this hidden from production builds; the dev server still renders it so we can inspect.

- [ ] **Step 2: Run `pnpm build`**

Run: `pnpm build`
Expected: PASS. The smoke page is `draft: true` so production build skips it, but Zod still validates the frontmatter against the discriminated union. If the union is misconfigured, this fails here.

- [ ] **Step 3: Run dev server and inspect**

Run: `pnpm dev`
Visit: `http://localhost:4321/_blocks-smoke`
Expected: a page rendering six dashed-bordered placeholder sections, in order: hero, figures, card-grid, feature-strip, pricing, cta-banner. Header strip and footer chrome present. No `<h1>` from the layout.

Stop the dev server when done.

- [ ] **Step 4: Delete the smoke page**

```bash
rm src/content/pages/_blocks-smoke.mdx
```

Do **not** commit the smoke page. It was scaffolding.

---

## Task 8: Negative-path verification (invalid block type)

**Files:**
- Create (then delete): `src/content/pages/_invalid-block.mdx`

Confirm that an unknown block `type` fails the build with a clear, named error.

- [ ] **Step 1: Create `src/content/pages/_invalid-block.mdx`**

```mdx
---
title: "Invalid block test"
description: "Temporary test page; should fail validation."
publishedAt: 2026-05-13
draft: true
blocks:
  - type: nope
---
```

- [ ] **Step 2: Run `pnpm build` and capture the error**

Run: `pnpm build`
Expected: FAIL. The output should name `pages/_invalid-block.mdx`, and the Zod message should indicate `blocks[0].type` got `nope` and expected one of `hero | figures | card-grid | feature-strip | pricing | cta-banner`.

If the error names the file and field clearly, the error model is acceptable. If it doesn't, file a follow-up — do not block this ticket.

- [ ] **Step 3: Delete the invalid test page**

```bash
rm src/content/pages/_invalid-block.mdx
```

- [ ] **Step 4: Run `pnpm build` to confirm clean state**

Run: `pnpm build`
Expected: PASS.

---

## Task 9: Final verification

- [ ] **Step 1: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: PASS, no errors.

- [ ] **Step 2: Run `pnpm build`**

Run: `pnpm build`
Expected: PASS. Routes generated for `/`, `/about`, `/services/astro`, `/blog`, `/blog/<each-slug>`, `/authors`, `/authors/<each-slug>`.

- [ ] **Step 3: Boot dev server and smoke existing pages**

Run: `pnpm dev`
Visit each of these and confirm they render unchanged from before this ticket:
- `http://localhost:4321/`
- `http://localhost:4321/about`
- `http://localhost:4321/services/astro`
- `http://localhost:4321/blog`
- `http://localhost:4321/authors`

Stop the dev server.

- [ ] **Step 4: Confirm working tree clean**

```bash
git status
```

Expected: clean. No leftover smoke pages, no stray files.

---

## Out-of-band follow-ups (do not do in this ticket)

These are noted in the spec; they belong in separate work:

- Retitle/rescope ROB-1982 and ROB-1989 from "port block" to "port chrome" — handle via Linear after this ticket is merged.
- Decide icon strategy (ROB-1994) — leaning `astro-icon` + Lucide.
- Real block markup and props (ROB-1983 – ROB-1988).
- Migrate `pages/*.mdx` to block-composed form (ROB-1995).
