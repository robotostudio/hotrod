# MDX content routes — design

**Date:** 2026-05-12
**Status:** Approved, ready for implementation plan
**Scope:** First pass of Hotrod's content system. Text-only; image storage is a later concern.

## Goal

Turn Hotrod into a working agent-driven content site by adding:

- MDX support via Astro's official integration.
- Three strict, type-safe content collections: `pages`, `blog`, `authors`.
- Routes that let any non-draft entry render at a predictable URL.
- Tailwind CSS v4 (default config) plus the typography plugin for content styling.
- Sample content for each collection so the dev server boots into something real.

The implementation must produce loud, human-readable build errors when content frontmatter is wrong, because non-technical users will be driving an agent to create that content.

## Stack additions

| Package | Why |
| --- | --- |
| `@astrojs/mdx` | MDX support — `.mdx` rendering for layouts/content. |
| `tailwindcss` | Styling. v4, used via the Vite plugin. |
| `@tailwindcss/vite` | Tailwind v4's Vite integration (the legacy `@astrojs/tailwind` integration is deprecated). |
| `@tailwindcss/typography` | `prose` classes for MDX content. |

No `tailwind.config.js`. Tailwind v4 uses CSS-first config; a theme will be added later via `@theme` in `global.css` without touching component code.

## Content collections

All three live under `src/content/` and are defined in `src/content/config.ts` using Zod schemas with `.strict()` so typo'd frontmatter keys throw rather than being silently ignored.

### Shared fields

Every collection includes:

- `publishedAt: Date` — required.
- `updatedAt: Date` — optional.

These are not rendered by default everywhere; they exist for OG/article meta tags, future sitemap `<lastmod>`, RSS, and freshness audits. Blog posts will render them via `post-meta.astro`.

### `pages` — marketing / arbitrary nested pages

```ts
{
  title: string,
  description: string,
  publishedAt: Date,
  updatedAt: Date | undefined,
  draft: boolean (default false),
}
```

File path determines URL:

- `src/content/pages/index.mdx` → `/`
- `src/content/pages/about.mdx` → `/about`
- `src/content/pages/services/astro.mdx` → `/services/astro`

### `blog` — posts

```ts
{
  title: string,
  description: string,
  publishedAt: Date,
  updatedAt: Date | undefined,
  author: reference('authors'),
  tags: string[] (default []),
  draft: boolean (default false),
}
```

Slug = filename. `src/content/blog/welcome-to-hotrod.mdx` → `/blog/welcome-to-hotrod`.

The `reference('authors')` field enforces that the linked author exists at build time. A typo throws a named error.

### `authors` — author profiles

```ts
{
  name: string,
  role: string | undefined,
  shortBio: string,
  social: {
    twitter: string | undefined,
    github: string | undefined,
    linkedin: string | undefined,
    website: string | undefined,
  } (default {}),
  publishedAt: Date,
  updatedAt: Date | undefined,
}
```

The MDX body is the long-form bio. Slug = filename. `src/content/authors/jono.mdx` → `/authors/jono`.

### Validation rules

- All three schemas use Zod `.strict()`.
- Every required field has a custom Zod error message written for a non-technical reader, e.g. `"Every post needs a publishedAt date in ISO format, e.g. 2026-05-12"`.
- Dates use `z.coerce.date(...)` so ISO strings in frontmatter parse to `Date` objects.
- No load-bearing optionals. If something matters for the site to work (title, slug-implied filename, author reference), it is required.
- Reference integrity via `reference('authors')`.

## Routes

```
src/pages/
├── [...slug].astro             # catch-all → renders any `pages` entry, including /
├── blog/
│   ├── index.astro             # lists all non-draft posts, sorted by publishedAt desc
│   └── [slug].astro            # renders a single post
└── authors/
    ├── index.astro             # lists all authors
    └── [slug].astro            # renders author profile + their posts
```

There is no hand-coded `src/pages/index.astro`. The homepage is `src/content/pages/index.mdx`, served by the catch-all.

### Route precedence

Astro resolves static and explicit dynamic routes before catch-alls, so `/blog/*` and `/authors/*` always win over `[...slug].astro`. No additional logic needed.

### Reserved-segment guard

To prevent a `pages` entry from silently shadowing a routed segment, `src/lib/content.ts` exposes a helper used by the catch-all's `getStaticPaths()` that throws a named build error if any `pages` entry's slug starts with `blog/` or `authors/`, or equals `blog`/`authors`.

### Draft handling

- A shared `getPublishedEntries(collection)` helper in `src/lib/content.ts` is the only function any route uses to query collections. It filters `draft: true` entries out in production builds.
- In dev (`import.meta.env.DEV`), drafts are included so agents can preview them.
- In production, draft entries never get a route generated, so they 404 by absence — no special handling needed.

## Layouts and components

```
src/layouts/
├── base-layout.astro           # html shell; imports global.css; emits OG meta
├── page-layout.astro           # marketing pages — title + prose body
├── post-layout.astro           # post title + post-meta + prose body
└── author-layout.astro         # author info + prose bio + their posts list

src/components/
└── post-meta.astro             # "Published {date}" + "Updated {date}" when present

src/lib/
├── content.ts                  # draft filter + reserved-slug guard
└── format-date.ts              # consistent date formatting
```

### `base-layout.astro`

- Renders `<html>`, `<head>` (charset, viewport, generator, favicons), `<body>` with a slot.
- Imports `../styles/global.css`.
- Accepts props: `title`, `description`, `publishedAt`, `updatedAt`, `type` (`'website'` | `'article'`).
- Emits OG meta tags including `article:published_time` and `article:modified_time` when the layout type is `'article'`.

### `page-layout.astro`, `post-layout.astro`, `author-layout.astro`

- All extend `base-layout.astro` by composition (`<BaseLayout>` wrapper).
- Wrap the MDX body in `<article class="prose">` to pick up typography styles.
- `post-layout.astro` renders `<PostMeta>` between the title and the body.
- `author-layout.astro` renders the author's `social` links (when present) and a list of their non-draft posts.

### `post-meta.astro`

- Props: `publishedAt: Date`, `updatedAt: Date | undefined`.
- Always renders "Published {date}".
- When `updatedAt` is set, also renders "Updated {date}" (no diff check — if the field is present in frontmatter, it is shown).
- Uses `format-date.ts` for formatting (one consistent format across the site).

### `format-date.ts`

- Single exported function `formatDate(date: Date): string`.
- Uses `Intl.DateTimeFormat` with a fixed locale (`en-GB`) and date-only output (no time, no timezone noise) for the first pass.

## File-naming convention

Every file uses **kebab-case**, including layouts and components. Astro requires component tags to start with a capital letter in templates, so layouts are imported with a PascalCase binding (`import BaseLayout from '../layouts/base-layout.astro'`) but the file on disk stays kebab.

## Sample content shipped with the starter

Every collection has at least one entry so `pnpm dev` boots into a fully working site:

- `src/content/pages/index.mdx` — homepage.
- `src/content/pages/about.mdx` — top-level page demo.
- `src/content/pages/services/astro.mdx` — nested page demo.
- `src/content/blog/welcome-to-hotrod.mdx` — sample post, references `jono`.
- `src/content/authors/jono.mdx` — Jono author profile.

All sample frontmatter uses real values, no `lorem` placeholder filler in load-bearing fields.

## Non-goals (deferred)

- Image storage and rendering. All content is text for now.
- RSS feed.
- Sitemap (the data needed for `<lastmod>` is captured, so it's easy to add later).
- Tag listing pages. (`tags` is captured in frontmatter but not rendered anywhere in the first pass.)
- Custom Tailwind theme (the structure supports adding `@theme` in `global.css` later without component changes).
- Pagination on listing pages (post counts will be small initially).
- Search.

## Build-time guarantees

The first implementation pass must demonstrate that all of these fail the build with a clear error message:

1. A blog post with a typo'd frontmatter key (e.g. `pubishedAt`).
2. A blog post referencing an author slug that does not exist.
3. A blog post missing a required field (e.g. no `title`).
4. A `pages` entry whose slug shadows `blog/` or `authors/`.

These are the contract this design exists to enforce.
