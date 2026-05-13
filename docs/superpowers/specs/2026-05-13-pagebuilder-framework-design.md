# Pagebuilder framework (block-composed pages) — design

**Linear:** [ROB-1993](https://linear.app/roboto/issue/ROB-1993)
**Date:** 2026-05-13
**Status:** Draft, pending user review

## Goal

Convert the `pages` content collection to a block-composed model where the
page shape lives in **frontmatter**, not the MDX body. Each entry carries an
optional `blocks: [...]` array; the renderer walks it and dispatches each
entry to its component, wrapped in a shared `<PageSections>` container.

This is the foundation that block tickets ROB-1983 – ROB-1988 plug into.
Body-only pages keep working unchanged via a fallback path.

## Why frontmatter, not JSX in body

Strict Zod validates every block's props at build time with custom error
messages aimed at non-technical authors. JSX-in-body would surrender that to
MDX/TypeScript parse errors written in the framework's voice. `blog` stays
MDX-body driven — blog = prose, pages = compositions.

## Scope corrections vs original ticket

Two design-time decisions diverge from the original ticket and are
authoritative going forward:

1. **Nav and footer are chrome, not blocks.** They live in
   `base-layout.astro`, render on every route, and are not authorable
   per-page. The discriminated union covers **6 blocks**:
   `hero | figures | card-grid | feature-strip | pricing | cta-banner`.
   ROB-1982 (nav) and ROB-1989 (footer) stay in Phase 3 but become
   "port nav/footer as chrome", not "port as block".

2. **Collection indexes stay hardcoded.** `/blog`, `/authors`, and future
   doc-type indexes (events, case studies) stay as hardcoded `.astro`
   routes that programmatically render filterable lists. They are
   deliberately **not** block-composed — keeping the doc-type-index
   experience consistent and opinionated. The pagebuilder is only for the
   `pages` collection (and any future collection that opts in by calling
   `buildBlocksField()`).

## File layout

```
src/blocks/
  registry.ts                # blockSchemas + blockComponents
  build-blocks-field.ts      # buildBlocksField() helper
  hero/
    schema.ts                # exports heroSchema
    index.astro              # stub renderer for this ticket
  figures/
  card-grid/
  feature-strip/
  pricing/
  cta-banner/

src/components/
  page-sections.astro        # vertical-rhythm wrapper

src/content.config.ts        # calls buildBlocksField() on pages collection
src/pages/[...slug].astro    # branches on `blocks` presence
```

All filenames kebab-case. Astro component import bindings stay PascalCase
(`import Hero from './blocks/hero/index.astro'`).

## Per-block folder contract

Each `src/blocks/<name>/` folder exports exactly two things:

- `schema.ts` — strict Zod schema for the block's props, including the
  `type` literal.
- `index.astro` — the renderer. Receives the parsed block as props.

For this ticket, all six block schemas carry only the `type` literal, and
all six components render a minimal stub:

```astro
<section data-block-stub="hero">hero (placeholder)</section>
```

Each block ticket (ROB-1983 – ROB-1988) replaces both halves of one folder.

## Registry

`src/blocks/registry.ts` is the single site of truth:

```ts
import { heroSchema } from './hero/schema';
import HeroComponent from './hero/index.astro';
// ...
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
  // ...
} as const;
```

Adding a future block = one folder + one line in each map. A TypeScript
check (`Record<keyof typeof blockSchemas, AstroComponent>` style) keeps
the two maps in lockstep.

## `buildBlocksField()` helper

`src/blocks/build-blocks-field.ts` is the only piece a consuming collection
imports:

```ts
import { z } from 'astro:content';
import { blockSchemas } from './registry';

export function buildBlocksField() {
  const schemas = Object.values(blockSchemas);
  return z.array(z.discriminatedUnion('type', schemas)).optional();
}
```

`content.config.ts` slots that into the existing `pages` schema:

```ts
const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z.object({
    title: requiredString('title'),
    description: requiredString('description'),
    publishedAt: z.coerce.date({ message: dateMessage('publishedAt') }),
    updatedAt: z.coerce.date({ message: dateMessage('updatedAt') }).optional(),
    draft: z.boolean().default(false),
    blocks: buildBlocksField(),
  }).strict(),
});
```

MDX body for `pages` becomes optional in practice (Astro allows empty
bodies); no schema change is needed to express this.

## `<PageSections>`

`src/components/page-sections.astro` is a thin vertical-rhythm wrapper:

```astro
---
// no props beyond children
---
<div class="flex flex-col">
  <slot />
</div>
```

It owns inter-block spacing only. Each block component handles its own
width (full-bleed vs. content-width container) and its own background
internally. There is no schema-level `fullBleed` flag — blocks decide.

This means: a hero block's `index.astro` is responsible for being
full-bleed; a card-grid block's `index.astro` is responsible for clamping
its inner content. No block component sets its own outer margin —
inter-block spacing is `<PageSections>`'s job.

## Dispatch in `[...slug].astro`

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

{blocks
  ? (
    <BaseLayout title={title} description={description}
                publishedAt={publishedAt} updatedAt={updatedAt}>
      <PageSections>
        {blocks.map((block) => {
          const Component = blockComponents[block.type];
          return <Component {...block} />;
        })}
      </PageSections>
    </BaseLayout>
  )
  : (
    <PageLayout title={title} description={description}
                publishedAt={publishedAt} updatedAt={updatedAt}>
      <Content />
    </PageLayout>
  )
}
```

The `blockComponents[block.type]` lookup is total — both maps come from
the same registry. The runtime branch for an unknown `type` is
unreachable because Zod has already rejected it at build time.

`title` / `description` always drive `<head>` via `<BaseLayout>`. With
`blocks` set, no auto-`<h1>` is rendered — the hero block carries the
visible H1.

## Error model

Each block schema names its fields using the existing `requiredString()` /
`dateMessage()` style:

```ts
export const heroSchema = z.object({
  type: z.literal('hero'),
  // (props arrive in later tickets, e.g.:)
  // title: z.string({ message: '`hero.title` is required.' }).min(1),
}).strict();
```

Astro's collection loader prepends the offending entry's slug (e.g.
`pages/services.mdx`) to schema errors automatically, so the resulting
build failure reads:

> Failed to parse `pages/services.mdx` — `hero.title` is required.

A small `blockField(blockName, field)` helper in
`src/blocks/_shared/messages.ts` (or inline per-block — confirm during
implementation) formats the messages so they always include the block
name. The build-time array index isn't reachable from a field-level Zod
message; we accept "names the block, not the index" as good enough, and
add the index later if it turns out to matter in practice.

Unknown block `type`: Zod's discriminated union surfaces a message of the
form ``Invalid discriminator value at `blocks[1].type`. Expected one of:
hero, figures, ...``. Astro prepends the file slug. That's acceptable
without further customization.

## Migration safety

- Existing `pages/index.mdx`, `pages/about.mdx`, `pages/services/astro.mdx`
  keep `blocks` unset → body-only fallback path → render unchanged.
- No changes to `blog`, `authors`, their schemas, or their hardcoded
  index routes.
- Reserved-slug guard stays as-is.
- `<BaseLayout>` chrome (header strip, checkerboard divider, footer)
  untouched.

The actual migration of `pages/*.mdx` entries to block-composed form is
ROB-1995, after the block tickets land.

## Verification

- `pnpm astro check` passes (types reflect the discriminated union).
- `pnpm build` passes (all existing pages still build; placeholder blocks
  render).
- Negative checks (manual, removed before merge):
  - Adding `blocks: [{ type: 'nope' }]` to a page fails the build with a
    discriminator error naming the file.
  - Adding `blocks: [{ type: 'hero' }]` to a page builds and renders the
    hero stub on the route.
- A Playwright smoke check loads `/` and `/about` and asserts the page
  renders without errors. No new fixtures required — uses the existing
  body-only pages.

## Out of scope

- Real block markup and props (ROB-1983 – ROB-1988).
- Icon strategy (ROB-1994) — leaning toward `astro-icon` + Lucide for
  simplicity, decided in that ticket.
- Nav/footer chrome work (ROB-1982, ROB-1989) — rescoped.
- Migrating existing pages (ROB-1995).
- Media support (Phase 4).
- Agent-facing CLAUDE.md (ROB-1996).
- Any change to `blog`, `authors`, or future doc-type collections.

## Open follow-ups

- Update ROB-1982 and ROB-1989 titles/bodies to reflect "chrome, not
  block". Do after this ticket's spec is approved.
- Decide later (post-block-tickets) whether to surface the block array
  index in Zod error messages, if real authoring shows it would help.
