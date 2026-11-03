---
name: compose-block
description: Use before creating or changing any block under src/blocks/ or any component a visitor sees under src/components/ — a new section type, a new field on a block, a restyle, a layout change, or a new shared component. Use whenever asked to "add a section that…", "make it look like…", add a UI element, or when a page request cannot be met with the existing blocks. Not for editing page content — that is compose-page.
---

# Compose a block

A block is one folder, one Zod schema, one Astro component and two lines in a
registry. The mechanics are small. The hard part is staying inside the system:
every block uses the same two surfaces, the same heavy type, the same square
`border-4` frames and the same few shared parts. A block that invents its own
rounded card, grey text or extra font size looks fine alone and makes the site
look less like one site.

## 0. Do you need a new block?

- Read every `src/blocks/*/schema.ts` and the live home page (`/`, which uses
  all eight) first.
- **Same content, different look or one more field → extend the existing
  block.** Add an optional field to its schema and handle it in its
  component.
- **Different content (different fields) → new block.**

## 1. Folder contract

Create `src/blocks/<kebab-name>/` with exactly two files. The folder name is
the block's `type`.

**`schema.ts`** exports `<camelName>Schema`:

```ts
import { z } from 'astro:content';
import { buttonSchema } from '../_shared/button-schema';

export const logoWallSchema = z
  .object({
    type: z.literal('logo-wall'),
    title: z
      .string({ message: '`logo-wall.title` is required.' })
      .min(1, { message: '`logo-wall.title` must not be empty.' }),
    items: z
      .array(/* … */)
      .min(4, { message: '`logo-wall.items` must contain at least four items.' })
      .max(8, { message: '`logo-wall.items` can contain at most eight items.' }),
    buttons: z.array(buttonSchema).max(1, { message: '…' }).optional(),
  })
  .strict();
```

- `type: z.literal('<name>')` first; `.strict()` on every object, nested ones
  too.
- Every field carries a message in the house format, written for a
  non-technical reader: `` `<block>.<field>` is required. ``,
  `` `<block>.<field>` must not be empty. ``, `` `<block>.items[].icon` … ``.
  These messages are what the agent and the site owner see when content is
  wrong.
- Arrays get `.min()` / `.max()` set to the counts the layout actually fills
  cleanly, with the numbers spelled out in the message.
- Defaults (`z.boolean().default(false)`) only where an omitted value has an
  obvious meaning.

**`index.astro`** receives the parsed block as props:

```astro
---
type Props = {
  type: 'logo-wall';
  title: string;
  items: { /* … */ }[];
};

const { title, items } = Astro.props;
---
<section class="bg-background text-foreground py-20 px-6">
  <div class="mx-auto max-w-7xl">…</div>
</section>
```

`Props` is written by hand to mirror the schema, including the `type`
literal, as every existing block does.

## 2. Register it

`src/blocks/registry.ts`: import the schema and the component, then add one
line to `blockSchemas` and one to `blockComponents`, using the same key.
`blockComponents` is checked with `satisfies Record<keyof typeof
blockSchemas, …>`, so a schema without a component fails `pnpm astro check`.
`build-blocks-field.ts` and `content.config.ts` pick up the new schema with no
other change.

## 3. Reuse before you write

| Need | Use |
|---|---|
| Buttons | `_shared/button-schema.ts` + copy the hero's filled/outlined classes |
| Image | `_shared/blob-image-schema.ts` + `<BlobImage image={…} sizes="…" />` |
| Video | `_shared/mux-video-schema.ts` + `<MuxVideo video={…} />` |
| Icon | `<Lucide name={…} class="w-12 h-12" />` (any Lucide name, open `z.string()`) |
| Highlighted title words | `<HighlightTitle text={…} />` (`==word==` syntax) |
| Divider for black blocks | `<CheckerboardDivider />` |

Components live in `src/components/`. A shared field shape used by a second
block moves into `src/blocks/_shared/`.

## 4. Design rules

Taken from the eight existing blocks. Copy the closest one rather than
starting blank.

**Surfaces.** Two only:
- Yellow: `bg-background text-foreground`. Renders no divider.
- Black: `bg-foreground text-background`. Renders `<CheckerboardDivider />`
  directly above and below its `<section>`.

**Wrapper.** `<section class="… py-20 px-6">` wrapping
`<div class="mx-auto max-w-7xl">` (`max-w-5xl` for a narrow centred block;
`py-16` for a compact strip like `figures`). A block owns its background and
inner width, never its outer margin: blocks stack flush.

**Colour.** Tokens only, from `src/styles/global.css`: `background`,
`foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `border` and
their `-foreground` pairs. Never a hex code, never a palette class
(`bg-zinc-500`, `text-gray-600`). Fade with opacity (`opacity-80`,
`bg-foreground/60`). There is no dark mode.

**Type.** Geist, heavy:
- Section title `h2`: `text-5xl md:text-6xl font-black` (centred, `mb-16`
  above a grid); `text-4xl md:text-5xl font-black` when it sits beside or
  above media (`image-feature`, `video-feature`).
- Item title `h3`: `text-xl font-black` to `text-2xl font-black`.
- Body: `font-semibold`; lede `text-xl md:text-2xl font-semibold`.
- Big numbers: `text-3xl`–`text-5xl font-black`.

**Shape.** Square corners. Frames are `border-4 border-foreground` (or
`border-background` on black). No `rounded-*` cards, no drop shadows.

**Classes.** Prefer canonical Tailwind v4 classes to arbitrary values
(`aspect-4/3`, not `aspect-[4/3]`; `w-95`, not `w-[380px]`). Never build a
class name from a variable (`md:grid-cols-${n}`): Tailwind cannot see it.
Map to full strings, as `video-feature` does for `tileCols`.

**Responsive.** Mobile first; one column by default, columns from `md:` /
`lg:`. Large type steps down on phones (`text-5xl md:text-6xl`).

**JavaScript.** None by default; blocks are server-rendered Astro. Add a
`<script>` only when the block cannot work without it (as `MuxVideo` does).
Gate decorative motion with `motion-safe:`.

**Media.** Never from `public/` (chrome only). Images come from Vercel Blob
via `BlobImage`, video from Mux via `MuxVideo`. `blobImageSchema` makes
`alt` required, so every content image gets real alt text from the page.
Pass `sizes` to `BlobImage` matching the column the image fills.

**Markup.** One `h2` per block, `h3` for items. A list of things is
`<ul>`/`<li>`. Links are `<a href>`; buttons are only for actions.

## 5. Show it, then document it

1. Use the block on a page with real copy: add it to
   `src/content/pages/index.mdx` if it belongs on home, otherwise to a
   `draft: true` page.
2. Add a row for it to the block table in
   `.claude/skills/compose-page/SKILL.md`. That table is how the next agent
   finds your block.

## 6. Verify

```sh
pnpm astro check   # types, registry lockstep (needs .env.local, see AGENTS.md)
pnpm build         # schemas, every page renders
pnpm dev           # look at it
```

Then look at the page at 375, 768 and 1440 px wide, next to the blocks above
and below it. A block can pass every check and still sit wrong against its
neighbours: double dividers, a mismatched width, a title one size off.
