---
name: compose-page
description: Use when adding or editing a page or blog post in this repo — finding the right MDX file under src/content/, writing frontmatter, choosing blocks from src/blocks/, and filling the YAML `blocks:` list. Use whenever asked to add a page, edit copy, add, remove or reorder a section, change a hero or CTA, or publish a post. Not for building a new kind of section — that is compose-block.
---

# Compose a page

Pages here are data, not code. A block page is a YAML `blocks:` list in the
MDX frontmatter; every entry is validated by a strict Zod schema at build
time. You are filling in pre-built blocks, not writing components. If the
build fails, the message names the exact field and what it expected. Read it,
fix the content, and never loosen a schema to make content pass.

## 1. Find the file

| Content | Path | URL |
|---|---|---|
| Pages | `src/content/pages/**/*.mdx` | path = URL: `index.mdx` → `/`, `about.mdx` → `/about`, `services/astro.mdx` → `/services/astro` |
| Blog posts | `src/content/blog/*.mdx` | `/blog/<filename>` |
| Authors | `src/content/authors/*.mdx` | `/authors/<filename>` |

- A new page is a new file. Filenames are kebab-case.
- A page's first path segment cannot be `blog` or `authors`; `src/lib/content.ts`
  throws, because it would shadow those routes.
- The header and footer links are hard-coded in `src/components/site-nav.astro`
  and `src/components/site-footer.astro`. A new page is **not** linked
  anywhere until you add it there (ask first; that is chrome, not content).

## 2. Pick the page mode

`src/pages/[...slug].astro` branches on `blocks`:

- **`blocks:` present → block page.** Rendered full-width in `BaseLayout`.
  **The MDX body below the frontmatter is ignored.** Do not write copy there.
- **No `blocks:` → prose page.** Rendered in `PageLayout`: an `<h1>` from
  `title`, then the MDX body as typography (`about.mdx`, `services/astro.mdx`).

`blocks: []` fails the build. Remove the line or add a block.

## 3. Frontmatter

Schemas live in `src/content.config.ts`. Every collection is `.strict()`, so
a misspelled or unknown key fails the build.

```yaml
---
title: "Astro websites"            # required
description: "…"                   # required, 80–220 chars, aim for 120–160
publishedAt: 2026-05-12            # required, ISO date
draft: true                        # new pages start true
---
```

- `description` is also the meta description and the social preview text.
  The length rule is enforced; write a real sentence, not a tagline.
- `metaDescription` (optional, same 80–220 rule) overrides `description` in
  meta tags only. Use it when the on-page intro makes a poor search snippet.
- `updatedAt` (optional ISO date): set it when you materially change a page.
- `draft: true` renders in `pnpm dev` and is left out of production builds.
  Start every **new** page as a draft; flip it once the owner approves.
- The Open Graph image is generated from `title` (`/og/<slug>.png`). There is
  no image field to set.

Blog posts also take `author` (required; must match a filename in
`src/content/authors/` without `.mdx`, e.g. `jono`), `tags` (string list) and
`featured` (boolean). Posts have no `blocks:`; the body is the post.

## 4. Choose blocks

The schema in `src/blocks/<type>/schema.ts` is the source of truth. Read it
before using a block. This table is a map, and the schema wins if they
disagree.

| `type` | Use it for | Fields (`?` = optional) | Counts |
|---|---|---|---|
| `hero` | Page opener, yellow | `title`, `text`, `buttons` | 1–3 buttons |
| `figures` | Row of big numbers, black | `items: [{value, label}]` | 2–6 items |
| `card-grid` | Icon cards with a title, yellow | `title`, `items: [{icon, title, description}]` | 2–4 items |
| `feature-strip` | Short benefits on black | `title`, `items: [{icon, title, description}]` | 3–6 items |
| `image-feature` | Image beside copy and stats | `heading`, `body`, `image`, `badge`, `stats: [{value, label}]` | 1–4 stats |
| `video-feature` | Mux video with badges and tiles, black | `heading`, `body`, `video`, `badges: [{value, label}]`, `tiles: [{icon, label}]` | 0–2 badges, 2–4 tiles |
| `pricing` | Plan cards | `title`, `plans: [{name, price, unit, features[], featured?, cta: {label, href}}]` | 2–4 plans |
| `cta-banner` | Closing call to action, black | `title`, `text`, `buttons` | 1–2 buttons |

`src/content/pages/index.mdx` uses all eight with real copy. Copy from it.

If no block can say what the page needs, that is a code change: use the
`compose-block` skill. Do not fake a section by bending another block's
fields.

## 5. Field shapes shared across blocks

- **Buttons** (`hero`, `cta-banner`): `{ label, href, variant?, icon? }`.
  `variant` is `filled` (default) or `outlined`. Put one `filled` button
  first; any second one is `outlined`. `href` can be a path (`/contact`), a
  full URL, `mailto:` or `tel:`.
- **Icons**: any [Lucide](https://lucide.dev/icons) name in kebab-case
  (`zap`, `map-pin`, `shield`). A name that does not exist fails at render.
- **Highlight**: in `hero.title` only, wrap words in `==…==` to set them on a
  black bar on their own line: `"CALL 1800 ==HOT ROD=="`. Other blocks print
  the `==` literally.
- **Images**: `image: { key, alt }`. `key` is a Vercel Blob pathname (e.g.
  `taxi.jpeg`) and the build checks it exists in Blob. Upload in the Vercel
  dashboard; never put content images in `public/`. `alt` is required and
  describes the picture.
- **Video**: `video: { playbackId, title }`. `playbackId` must be a public Mux
  playback ID that exists in the Mux account; the build checks it.
- **House style**: block titles are UPPERCASE (`"WHAT'S UNDER THE HOOD"`);
  body copy is sentence case. Quote every YAML string that contains `:`,
  `#`, `'` or starts with a special character. Quoting all strings is safest.

## 6. Give the page a shape

Do not stack blocks at random. The home page runs: `hero` (what it is) →
`figures` (proof) → `card-grid` and `feature-strip` (what you get) →
`image-feature` / `video-feature` (show it) → `pricing` → `cta-banner` (one
action). A short landing page is often `hero` → one feature block →
`cta-banner`. End on a single `cta-banner`.

Black blocks (`figures`, `feature-strip`, `video-feature`, `cta-banner`) draw
checkerboard dividers above and below themselves, so two black blocks in a row
get two dividers back to back. Alternate yellow and black where you can.

## 7. Validate, then look

```sh
pnpm build        # runs every Zod schema; the error names the file and field
pnpm dev          # http://localhost:4321/<slug>
```

- Both need the Blob and Mux tokens locally. If they are missing, run
  `shelve pull` (see Commands in `AGENTS.md`); never paste token values into
  chat.
- Check whether a dev server is already running before starting another.
- `pnpm build` checks a draft's frontmatter but does not render the page, so
  render errors on a draft (an unknown icon, for one) only show in
  `pnpm dev`. Open every draft you touch in the dev server.
- A green build is not done. Open the page and read it at phone width and
  desktop width. Check the buttons go where they should.
