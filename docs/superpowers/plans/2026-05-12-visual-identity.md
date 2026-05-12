# Phase 2: Visual identity + chrome — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Hotrod's actual visual brand (yellow + black, Geist, checkerboard divider, bold typography chrome) from `jonoroboto/v0-taxi-landing-page` into the Astro site at `hotrod.robotostudio.com`, translating React+Next+shadcn → Astro 6 + Tailwind v4.

**Architecture:** Two surfaces change. (1) `src/styles/global.css` becomes the home of trimmed shadcn-style CSS custom properties + Tailwind v4 `@theme inline` mapping. (2) `src/layouts/base-layout.astro` gains a new chrome (black header strip with HOTROD wordmark + nav, checkerboard divider, yellow body, black footer). Fonts come from Astro 6's `fonts` API with the fontsource provider. The three non-base layouts are minor restyles. No content, schema, or route changes.

**Tech Stack:** Astro 6.3.x, Tailwind v4 (via `@tailwindcss/vite`), `@tailwindcss/typography`, Astro `fonts` API + `fontProviders.fontsource()`, Geist + Geist Mono.

**Spec:** `docs/superpowers/specs/2026-05-12-visual-identity-design.md`

**API correction vs spec:** The spec sketched the fonts config under `experimental.fonts`. Verified against Astro 6 docs: the feature graduated out of experimental — the array is a top-level `fonts:` option of `defineConfig`, and the `<Font />` component is imported from `astro:assets`. The plan uses the verified shape.

**Verification convention:** No test framework (per project convention from `docs/next-up.md`). Verification is `pnpm astro check` + `pnpm build` + ad-hoc Playwright MCP smoke checks. Tasks below follow "change → build/smoke → commit" cycles.

---

## Task 1: Wire the fonts integration into `astro.config.mjs`

**Files:**
- Modify: `/Users/jono/dev/hotrod/astro.config.mjs`

- [ ] **Step 1: Read the current config**

Current contents:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: vercel({
    imageService: true,
  }),
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 2: Replace the file contents**

Write the entire file as:

```js
// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: vercel({
    imageService: true,
  }),
  integrations: [mdx()],
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

Two changes only: (a) named import `fontProviders` added, (b) new `fonts:` top-level array. Adapter, integrations, vite block remain identical.

- [ ] **Step 3: Run type check**

Run: `pnpm astro check`

Expected: 0 errors. Warnings about the `fonts` feature being newly stable in Astro 6 are acceptable. Zod-deprecation hints from the pre-existing `src/content.config.ts` (22 hints) are unchanged.

If `pnpm astro check` reports an error like "Property 'fonts' does not exist on type 'AstroUserConfig'" or "fontProviders is not exported", STOP and report — the API may have shifted between minor releases. Do not improvise.

- [ ] **Step 4: Run a local build to confirm fonts resolve**

Run: `pnpm build 2>&1 | tail -30`

Expected: build completes; log mentions resolving Geist + Geist Mono (look for "fontsource" or "fonts" lines). Build output still contains the 7 routes from Phase 1. If the fontsource provider can't fetch the font (e.g. offline), the build will fail with a clear error — in that case, STOP and report.

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs
git commit -m "$(cat <<'EOF'
Wire Astro fonts API with Geist + Geist Mono

Adds top-level fonts: [] to astro.config.mjs using
fontProviders.fontsource(). Exposes --font-sans (Geist) and
--font-mono (Geist Mono) as CSS variables; consumed by the theme
layer and base layout in later tasks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Replace `src/styles/global.css` with the token system

**Files:**
- Modify: `/Users/jono/dev/hotrod/src/styles/global.css`

- [ ] **Step 1: Read the current file**

Current contents:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

Two lines only. The new file replaces this completely.

- [ ] **Step 2: Write the new contents**

Replace the entire file with:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

:root {
  /* Palette — yellow-cab brand */
  --background: #FFD700;
  --foreground: #000000;
  --card: #FFEB3B;
  --card-foreground: #000000;
  --primary: #000000;
  --primary-foreground: #FFD700;
  --secondary: #FFC107;
  --secondary-foreground: #000000;
  --muted: #F5D000;
  --muted-foreground: #333333;
  --accent: #FFEB3B;
  --accent-foreground: #000000;
  --border: #000000;

  /* Geometry */
  --radius: 0.625rem;
}

@theme inline {
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-border: var(--border);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }

  /*
   * Prose overrides for blog/author bodies. The default tailwindcss/typography
   * palette ("slate") is unreadable on yellow — override the prose CSS vars so
   * headings, body, links, code, and quotes all render in black.
   */
  .prose {
    --tw-prose-body: var(--foreground);
    --tw-prose-headings: var(--foreground);
    --tw-prose-lead: var(--foreground);
    --tw-prose-links: var(--foreground);
    --tw-prose-bold: var(--foreground);
    --tw-prose-counters: var(--foreground);
    --tw-prose-bullets: var(--foreground);
    --tw-prose-hr: var(--foreground);
    --tw-prose-quotes: var(--foreground);
    --tw-prose-quote-borders: var(--foreground);
    --tw-prose-captions: var(--muted-foreground);
    --tw-prose-code: var(--foreground);
    --tw-prose-pre-code: var(--primary-foreground);
    --tw-prose-pre-bg: var(--primary);
    --tw-prose-th-borders: var(--foreground);
    --tw-prose-td-borders: var(--foreground);
  }
}
```

Notes for the implementer:
- The `--font-sans: var(--font-sans)` line on the left of `@theme inline` is **deliberate**, not a typo. The Astro fonts integration sets `--font-sans` on `:root`; the `@theme inline` block reads that value and exposes it to Tailwind so utilities like `font-sans` resolve correctly.
- The `<Font />` component (added to `base-layout.astro` in Task 4) is what actually wires the integration to the page.
- The prose overrides cover both light and dark slots (the typography plugin still uses both internally).

- [ ] **Step 3: Type check**

Run: `pnpm astro check`

Expected: 0 errors. No new warnings related to CSS.

- [ ] **Step 4: Build**

Run: `pnpm build 2>&1 | tail -15`

Expected: build completes; the generated CSS in `dist/_astro/*.css` should contain rules like `background-color: var(--background)` resolved to yellow utilities. The build log doesn't typically validate CSS variable usage — visual verification happens in Task 4 once the layout is wired up.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css
git commit -m "$(cat <<'EOF'
Add Hotrod design tokens to global.css

Trims the v0-taxi-landing-page token system to what Hotrod actually
uses: yellow/black palette, Geist font variables, radius scale, and
@tailwindcss/typography prose overrides so blog bodies read on
yellow. No dark mode, no chart/sidebar tokens.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `src/components/checkerboard-divider.astro`

**Files:**
- Create: `/Users/jono/dev/hotrod/src/components/checkerboard-divider.astro`

- [ ] **Step 1: Create the file**

Write the file with this exact content:

```astro
---
interface Props {
  rows?: number;
  squareSize?: number;
  class?: string;
}

const { rows = 2, squareSize = 28, class: className = '' } = Astro.props;

const height = rows * squareSize;
const tileSize = squareSize * 2;
const halfSize = squareSize;
---

<div
  class:list={['w-full', className]}
  style={`
    height: ${height}px;
    background-color: var(--background);
    background-image:
      linear-gradient(45deg, var(--foreground) 25%, transparent 25%),
      linear-gradient(-45deg, var(--foreground) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--foreground) 75%),
      linear-gradient(-45deg, transparent 75%, var(--foreground) 75%);
    background-size: ${tileSize}px ${tileSize}px;
    background-position: 0 0, 0 ${halfSize}px, ${halfSize}px -${halfSize}px, -${halfSize}px 0px;
  `}
/>
```

Direct port of `components/checkerboard-divider.tsx` from `jonoroboto/v0-taxi-landing-page`. Behaviour identical: a `rows × full-width` band of taxi-cab checker pattern. Uses CSS custom properties so it stays in sync with the palette.

- [ ] **Step 2: Type check**

Run: `pnpm astro check`

Expected: 0 errors. The `Props` interface compiles; `class:list` is a built-in Astro directive (no import needed).

- [ ] **Step 3: Commit**

```bash
git add src/components/checkerboard-divider.astro
git commit -m "$(cat <<'EOF'
Add CheckerboardDivider Astro component

Direct port of components/checkerboard-divider.tsx from the source
brand repo. Pure CSS linear-gradient pattern, props for rows and
square size, references --background/--foreground so palette
changes propagate.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Rewrite `src/layouts/base-layout.astro`

**Files:**
- Modify: `/Users/jono/dev/hotrod/src/layouts/base-layout.astro`

This is the load-bearing visual change. All four layouts wrap this one.

- [ ] **Step 1: Read the current file**

Current contents (for reference — full replacement happens in Step 2):

```astro
---
import '../styles/global.css';

type Props = {
  title: string;
  description: string;
  type?: 'website' | 'article';
  publishedAt?: Date;
  updatedAt?: Date;
};

const {
  title,
  description,
  type = 'website',
  publishedAt,
  updatedAt,
} = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content={type} />
    {type === 'article' && publishedAt && (
      <meta property="article:published_time" content={publishedAt.toISOString()} />
    )}
    {type === 'article' && updatedAt && (
      <meta property="article:modified_time" content={updatedAt.toISOString()} />
    )}
  </head>
  <body class="min-h-screen bg-white text-slate-900 antialiased">
    <header class="border-b border-slate-200">
      <nav class="mx-auto flex max-w-3xl items-center gap-6 px-4 py-4 text-sm">
        <a href="/" class="font-semibold">Hotrod</a>
        <a href="/blog" class="text-slate-600 hover:text-slate-900">Blog</a>
        <a href="/authors" class="text-slate-600 hover:text-slate-900">Authors</a>
      </nav>
    </header>
    <main class="mx-auto max-w-3xl px-4 py-12">
      <slot />
    </main>
    <footer class="mx-auto max-w-3xl px-4 py-12 text-sm text-slate-500">
      Built with Hotrod.
    </footer>
  </body>
</html>
```

- [ ] **Step 2: Replace the file contents**

Write the file as:

```astro
---
import '../styles/global.css';
import { Font } from 'astro:assets';
import CheckerboardDivider from '../components/checkerboard-divider.astro';

type Props = {
  title: string;
  description: string;
  type?: 'website' | 'article';
  publishedAt?: Date;
  updatedAt?: Date;
};

const {
  title,
  description,
  type = 'website',
  publishedAt,
  updatedAt,
} = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="generator" content={Astro.generator} />
    <Font cssVariable="--font-sans" preload />
    <Font cssVariable="--font-mono" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content={type} />
    {type === 'article' && publishedAt && (
      <meta property="article:published_time" content={publishedAt.toISOString()} />
    )}
    {type === 'article' && updatedAt && (
      <meta property="article:modified_time" content={updatedAt.toISOString()} />
    )}
  </head>
  <body class="min-h-screen bg-background text-foreground font-sans antialiased">
    <header class="bg-primary text-primary-foreground">
      <nav class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" class="text-2xl font-black tracking-tight">HOTROD</a>
        <div class="flex items-center gap-8 font-bold">
          <a href="/blog" class="hover:underline underline-offset-4">Blog</a>
          <a href="/authors" class="hover:underline underline-offset-4">Authors</a>
        </div>
      </nav>
    </header>

    <CheckerboardDivider />

    <main class="min-h-[60vh]">
      <slot />
    </main>

    <footer class="bg-primary text-primary-foreground text-center py-6 font-bold">
      Built with Hotrod.
    </footer>
  </body>
</html>
```

What changed:
- New imports: `Font` from `astro:assets`, `CheckerboardDivider` from the new component.
- `<head>` adds two `<Font cssVariable="...">` tags (sans is preloaded, mono is not — mono is rare on chrome and preloading it would waste bytes).
- `<body>` switches from `bg-white text-slate-900` to `bg-background text-foreground font-sans`.
- `<header>` switches from a thin slate border to a full black strip with the HOTROD wordmark (left) and bold nav links (right).
- `<CheckerboardDivider />` placed directly below the header.
- `<main>` loses the `max-w-3xl mx-auto px-4 py-12` container — that responsibility moves to the inner layouts (page/post/author) in Tasks 5–7. The main here just sets a minimum height so short pages don't make the footer hug the divider.
- `<footer>` switches to a black-strip "Built with Hotrod." pattern.

- [ ] **Step 3: Type check**

Run: `pnpm astro check`

Expected: 0 errors. New `Font` import from `astro:assets` is provided by Astro core (no extra dep). `CheckerboardDivider` import resolves.

If type check fails on `import { Font } from 'astro:assets'`, the Font component may live elsewhere in Astro 6.3.x (it has lived in `astro:assets` per the docs, but if the API moved, STOP and report — do not improvise the import path).

- [ ] **Step 4: Build**

Run: `pnpm build 2>&1 | tail -25`

Expected: 7 routes still build, Vercel adapter + fonts integration both active. Output ends with "Complete!".

- [ ] **Step 5: Visual smoke check via dev server**

Run in one terminal: `pnpm dev`

Run in another terminal (or use the Playwright MCP):

```bash
/usr/bin/curl -sI http://localhost:4321/ | head -3
```

Expected: `HTTP/1.1 200 OK`.

Then (via Playwright MCP), navigate to `http://localhost:4321/`. Confirm:
- Yellow page background.
- Black header strip at top.
- "HOTROD" wordmark left, "Blog" + "Authors" right, both in Geist (or Geist's variable fallback while loading).
- Checkerboard divider band directly under the header.
- Footer at the bottom: black strip, "Built with Hotrod." in yellow text.
- No console errors.

Stop the dev server after the check.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/base-layout.astro
git commit -m "$(cat <<'EOF'
Reskin base layout with HOTROD brand chrome

Black top strip with HOTROD wordmark + nav, checkerboard divider,
yellow body, black footer. Wires Geist + Geist Mono via the
<Font /> component. Inner content max-width moves to per-layout
containers in following tasks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Update `src/layouts/page-layout.astro`

**Files:**
- Modify: `/Users/jono/dev/hotrod/src/layouts/page-layout.astro`

- [ ] **Step 1: Read the current file**

Current contents:

```astro
---
import BaseLayout from './base-layout.astro';

type Props = {
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
};

const { title, description, publishedAt, updatedAt } = Astro.props;
---

<BaseLayout
  title={title}
  description={description}
  publishedAt={publishedAt}
  updatedAt={updatedAt}
>
  <article class="prose prose-slate">
    <h1>{title}</h1>
    <slot />
  </article>
</BaseLayout>
```

- [ ] **Step 2: Replace the file contents**

Write the file as:

```astro
---
import BaseLayout from './base-layout.astro';

type Props = {
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
};

const { title, description, publishedAt, updatedAt } = Astro.props;
---

<BaseLayout
  title={title}
  description={description}
  publishedAt={publishedAt}
  updatedAt={updatedAt}
>
  <article class="prose mx-auto max-w-3xl px-6 py-12">
    <h1>{title}</h1>
    <slot />
  </article>
</BaseLayout>
```

What changed:
- `prose prose-slate` → `prose` (palette comes from the prose overrides in `global.css`; the slate variant is wrong for yellow).
- Added `mx-auto max-w-3xl px-6 py-12` — container responsibility moved out of `base-layout`'s `<main>` to here.

- [ ] **Step 3: Type check**

Run: `pnpm astro check`

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/page-layout.astro
git commit -m "$(cat <<'EOF'
Restyle page layout for new palette

Drops the prose-slate variant (now palette is governed by prose
overrides in global.css) and applies the inner max-w-3xl container.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Update `src/layouts/post-layout.astro`

**Files:**
- Modify: `/Users/jono/dev/hotrod/src/layouts/post-layout.astro`

- [ ] **Step 1: Read the current file**

Current contents:

```astro
---
import BaseLayout from './base-layout.astro';
import PostMeta from '../components/post-meta.astro';
import type { CollectionEntry } from 'astro:content';

type Props = {
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  author: CollectionEntry<'authors'>;
};

const { title, description, publishedAt, updatedAt, author } = Astro.props;
---

<BaseLayout
  title={title}
  description={description}
  type="article"
  publishedAt={publishedAt}
  updatedAt={updatedAt}
>
  <article class="prose prose-slate">
    <h1>{title}</h1>
    <PostMeta publishedAt={publishedAt} updatedAt={updatedAt} />
    <p class="text-sm text-slate-500">
      By <a href={`/authors/${author.id}`}>{author.data.name}</a>
    </p>
    <slot />
  </article>
</BaseLayout>
```

- [ ] **Step 2: Replace the file contents**

Write the file as:

```astro
---
import BaseLayout from './base-layout.astro';
import PostMeta from '../components/post-meta.astro';
import type { CollectionEntry } from 'astro:content';

type Props = {
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  author: CollectionEntry<'authors'>;
};

const { title, description, publishedAt, updatedAt, author } = Astro.props;
---

<BaseLayout
  title={title}
  description={description}
  type="article"
  publishedAt={publishedAt}
  updatedAt={updatedAt}
>
  <article class="prose mx-auto max-w-3xl px-6 py-12">
    <h1>{title}</h1>
    <PostMeta publishedAt={publishedAt} updatedAt={updatedAt} />
    <p class="text-sm font-semibold">
      By <a href={`/authors/${author.id}`}>{author.data.name}</a>
    </p>
    <slot />
  </article>
</BaseLayout>
```

What changed:
- `prose prose-slate` → `prose mx-auto max-w-3xl px-6 py-12` (same pattern as page layout).
- Byline `text-slate-500` → `font-semibold` (no color override; inherits foreground black for legibility on yellow).

- [ ] **Step 3: Type check**

Run: `pnpm astro check`

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/post-layout.astro
git commit -m "$(cat <<'EOF'
Restyle post layout for new palette

Same container update as page layout. Byline drops slate-500 in
favour of inheriting foreground; black on yellow reads cleanly.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Update `src/layouts/author-layout.astro`

**Files:**
- Modify: `/Users/jono/dev/hotrod/src/layouts/author-layout.astro`

- [ ] **Step 1: Read the current file**

Current contents:

```astro
---
import BaseLayout from './base-layout.astro';
import type { CollectionEntry } from 'astro:content';

type Props = {
  author: CollectionEntry<'authors'>;
  posts: CollectionEntry<'blog'>[];
};

const { author, posts } = Astro.props;
const { name, role, shortBio, social } = author.data;
---

<BaseLayout title={name} description={shortBio}>
  <article class="prose prose-slate">
    <h1>{name}</h1>
    {role && <p class="text-sm uppercase tracking-wide text-slate-500">{role}</p>}
    <p class="lead">{shortBio}</p>
    <slot />
    {Object.keys(social).length > 0 && (
      <ul>
        {social.twitter && <li><a href={`https://twitter.com/${social.twitter}`}>Twitter</a></li>}
        {social.github && <li><a href={`https://github.com/${social.github}`}>GitHub</a></li>}
        {social.linkedin && <li><a href={`https://linkedin.com/in/${social.linkedin}`}>LinkedIn</a></li>}
        {social.website && <li><a href={social.website}>Website</a></li>}
      </ul>
    )}
  </article>
  {posts.length > 0 && (
    <section class="mt-12">
      <h2 class="text-2xl font-semibold">Posts by {name}</h2>
      <ul class="mt-4 space-y-3">
        {posts.map((post) => (
          <li>
            <a href={`/blog/${post.id}`} class="font-medium hover:underline">
              {post.data.title}
            </a>
            <p class="text-sm text-slate-500">{post.data.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )}
</BaseLayout>
```

- [ ] **Step 2: Replace the file contents**

Write the file as:

```astro
---
import BaseLayout from './base-layout.astro';
import type { CollectionEntry } from 'astro:content';

type Props = {
  author: CollectionEntry<'authors'>;
  posts: CollectionEntry<'blog'>[];
};

const { author, posts } = Astro.props;
const { name, role, shortBio, social } = author.data;
---

<BaseLayout title={name} description={shortBio}>
  <div class="mx-auto max-w-3xl px-6 py-12">
    <article class="prose">
      <h1>{name}</h1>
      {role && <p class="text-sm font-bold uppercase tracking-wide">{role}</p>}
      <p class="lead">{shortBio}</p>
      <slot />
      {Object.keys(social).length > 0 && (
        <ul>
          {social.twitter && <li><a href={`https://twitter.com/${social.twitter}`}>Twitter</a></li>}
          {social.github && <li><a href={`https://github.com/${social.github}`}>GitHub</a></li>}
          {social.linkedin && <li><a href={`https://linkedin.com/in/${social.linkedin}`}>LinkedIn</a></li>}
          {social.website && <li><a href={social.website}>Website</a></li>}
        </ul>
      )}
    </article>
    {posts.length > 0 && (
      <section class="mt-12">
        <h2 class="text-2xl font-black tracking-tight">Posts by {name}</h2>
        <ul class="mt-4 space-y-3">
          {posts.map((post) => (
            <li>
              <a href={`/blog/${post.id}`} class="font-bold hover:underline underline-offset-4">
                {post.data.title}
              </a>
              <p class="text-sm font-medium">{post.data.description}</p>
            </li>
          ))}
        </ul>
      </section>
    )}
  </div>
</BaseLayout>
```

What changed:
- Container `<div class="mx-auto max-w-3xl px-6 py-12">` wraps both the prose article and the "Posts by" section so they share the same width.
- `prose prose-slate` → `prose`.
- `role` line: `text-slate-500` removed; added `font-bold` to compensate for the loss of the muted-grey emphasis (kept uppercase tracking).
- "Posts by" heading: `text-2xl font-semibold` → `text-2xl font-black tracking-tight` (matches the wordmark/heading treatment).
- Post link `font-medium hover:underline` → `font-bold hover:underline underline-offset-4` (matches nav link styling).
- Post description `text-slate-500` → `font-medium` (no color override; reads on yellow).

- [ ] **Step 3: Type check**

Run: `pnpm astro check`

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/author-layout.astro
git commit -m "$(cat <<'EOF'
Restyle author layout for new palette

Wraps article + posts list in a shared max-w-3xl container, drops
prose-slate, replaces muted slate text with weight emphasis, and
matches heading + link styling to the new wordmark/nav.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Update `src/components/post-meta.astro`

**Files:**
- Modify: `/Users/jono/dev/hotrod/src/components/post-meta.astro`

- [ ] **Step 1: Read the current file**

Current contents:

```astro
---
import { formatDate } from '../lib/format-date';

type Props = {
  publishedAt: Date;
  updatedAt?: Date;
};

const { publishedAt, updatedAt } = Astro.props;
---

<p class="text-sm text-slate-500">
  <span>Published {formatDate(publishedAt)}</span>
  {updatedAt && (
    <>
      <span class="mx-2">·</span>
      <span>Updated {formatDate(updatedAt)}</span>
    </>
  )}
</p>
```

- [ ] **Step 2: Replace the file contents**

Write the file as:

```astro
---
import { formatDate } from '../lib/format-date';

type Props = {
  publishedAt: Date;
  updatedAt?: Date;
};

const { publishedAt, updatedAt } = Astro.props;
---

<p class="text-sm font-semibold">
  <span>Published {formatDate(publishedAt)}</span>
  {updatedAt && (
    <>
      <span class="mx-2">·</span>
      <span>Updated {formatDate(updatedAt)}</span>
    </>
  )}
</p>
```

Only change: `text-slate-500` → `font-semibold`. Same reasoning as the byline — inherit foreground (black) for legibility, use weight for hierarchy.

- [ ] **Step 3: Type check**

Run: `pnpm astro check`

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/post-meta.astro
git commit -m "$(cat <<'EOF'
Restyle post-meta to inherit foreground colour

Drops text-slate-500 (illegible on yellow) and uses font-semibold
for hierarchy. Consistent with the byline treatment in post-layout.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Delete stale repo-root screenshots

**Files:**
- Remove: `/Users/jono/dev/hotrod/homepage.png`
- Remove: `/Users/jono/dev/hotrod/hotrod-home.png`

- [ ] **Step 1: Confirm the files exist**

Run: `ls -la /Users/jono/dev/hotrod/homepage.png /Users/jono/dev/hotrod/hotrod-home.png`

Expected: both files listed. If either is missing, note it but proceed with the one that exists.

- [ ] **Step 2: Remove them via git**

```bash
git rm homepage.png hotrod-home.png
```

If only one exists, run `git rm` against only that one.

- [ ] **Step 3: Confirm removal**

Run: `git status`

Expected: shows `deleted: homepage.png` and `deleted: hotrod-home.png` (or whichever existed).

Run: `ls /Users/jono/dev/hotrod/*.png 2>&1`

Expected: no matches (or "No such file"). The repo root no longer has stray screenshots.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
Remove pre-design screenshots from repo root

homepage.png and hotrod-home.png captured the unbranded slate
layout. They mislead a reader once Phase 2 ships the new design.
New screenshots, if needed, will be re-added intentionally.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Add a "Design" section to `README.md`

**Files:**
- Modify: `/Users/jono/dev/hotrod/README.md`

- [ ] **Step 1: Locate the insertion point**

`README.md` currently has these top-level headings in order: `# Hotrod`, `## Getting started`, `## Project structure`, `## Content`, `## Media`, `## Commands`, `## Deploying`, `## License`.

The new section goes between `## Media` and `## Commands`.

- [ ] **Step 2: Insert the new section**

Insert this exact markdown block immediately before `## Commands` and after the Media section's last paragraph (the line ending with "the first content pass is text-only."):

```markdown
## Design

Hotrod's visual identity is a yellow-cab-themed brand: bold typography, a black-and-yellow palette, and a checkerboard divider as recurring chrome.

### Palette and tokens

All design tokens live in `src/styles/global.css`. The structure mirrors shadcn/ui's CSS-custom-property pattern but trimmed to what Hotrod actually uses — no dark mode, no chart or sidebar tokens. To change the palette, edit the `:root` block; the `@theme inline` block re-exposes those values to Tailwind so utilities like `bg-background` and `text-foreground` stay in sync.

### Fonts

Geist and Geist Mono are loaded via Astro 6's [fonts API](https://docs.astro.build/en/guides/fonts/) with the `fontsource` provider, configured in `astro.config.mjs`. The base layout includes `<Font cssVariable="--font-sans" preload />` so the sans font preloads on every page.

### Brand chrome

The black header strip with `HOTROD` wordmark, the `<CheckerboardDivider />` underneath, and the black footer all live in `src/layouts/base-layout.astro`. Inner content max-widths live in the per-route layouts (`page-layout.astro`, `post-layout.astro`, `author-layout.astro`).

```

(Insert with one trailing blank line so the next heading sits one line below.)

- [ ] **Step 3: Sanity-check**

Run: `grep -n '^## ' /Users/jono/dev/hotrod/README.md`

Expected: heading order is now `Getting started`, `Project structure`, `Content`, `Media`, **`Design`**, `Commands`, `Deploying`, `License`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
Document Hotrod design system in README

New Design section covers palette/tokens in global.css, the Astro
fonts API with Geist + Geist Mono, and where the brand chrome
(header strip, checkerboard divider, footer) lives in
base-layout.astro.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Local pre-push verification

**Files:** none modified — verification only.

- [ ] **Step 1: Confirm working tree clean**

Run: `git status`

Expected: "nothing to commit, working tree clean".

If anything is uncommitted, the previous tasks didn't commit cleanly. Investigate before pushing.

- [ ] **Step 2: Full clean rebuild**

```bash
rm -rf dist .vercel/output node_modules/.astro
pnpm install
pnpm astro check
pnpm build
```

Expected:
- `pnpm install` is a no-op or quick re-link.
- `pnpm astro check`: 0 errors, 0 warnings (the 22 pre-existing Zod-deprecation hints from `src/content.config.ts:1` are expected and unchanged).
- `pnpm build`: completes, 7 routes built, Vercel adapter active, fonts integration log line present.

- [ ] **Step 3: Local Playwright smoke check**

Start the dev server: `pnpm dev` (in a background-friendly way — Bash's `run_in_background: true`).

Then, using the Playwright MCP, navigate to each route and verify:

- `http://localhost:4321/` — yellow body, black header with "HOTROD" wordmark, "Blog" + "Authors" nav, checkerboard divider visible, footer "Built with Hotrod." on black strip.
- `http://localhost:4321/blog/welcome-to-hotrod` — post title in heavy black weight, "Published 12 May 2026" + "By Jono" byline render in black (not slate), MDX body legible on yellow.
- `http://localhost:4321/authors/jono` — name heading in black-tracking-tight, "Founder, Roboto Studio" role uppercase-bold, social list, "Posts by Jono" section with the welcome post linked.
- `http://localhost:4321/about` and `http://localhost:4321/services/astro` — prose renders cleanly, same chrome.

For each, also capture `browser_console_messages(level: 'error')` — expected: 0 errors.

If anything looks off (font not loading, prose unreadable, divider missing), STOP and investigate. Do not push a broken build to production.

Stop the dev server when done.

- [ ] **Step 4: Confirm commit history**

Run: `git log --oneline -10`

Expected: 10 new commits on `main` since `b7bb98f` (Phase 1 close-out), from Tasks 1–10.

---

## Task 12: Push and verify Vercel deploy

**Files:** none modified.

This task is user-blocking only in spirit — the agent runs the push and the verification commands; the user is asked to confirm.

- [ ] **Step 1: Push to `main`**

```bash
git push origin main
```

Expected: push succeeds, ~10 commits go to origin.

- [ ] **Step 2: Wait for and inspect the Vercel build**

Run: `pnpm dlx vercel ls hotrod --scope roboto-pro 2>&1 | tail -10`

Watch for the new deploy to appear at the top with status `● Ready`. If status shows `● Building`, wait ~30s and re-run.

Build duration should be ~10-20s (similar to Phase 1's 9-11s, plus a few seconds for the fonts to fetch). If it's > 90s or the status flips to `● Error`, run `pnpm dlx vercel inspect <deployment-url> --logs` and report.

- [ ] **Step 3: Live-domain Playwright smoke check**

Using the Playwright MCP, navigate to:

- `https://hotrod.robotostudio.com/` — expect: 200, yellow body, HOTROD wordmark, checkerboard divider, footer. Console: 0 errors.
- `https://hotrod.robotostudio.com/blog/welcome-to-hotrod` — expect: 200, post body legible, byline + meta render in black.
- `https://hotrod.robotostudio.com/authors/jono` — expect: 200, "Posts by Jono" section renders.

For each, capture the accessibility snapshot (or take a screenshot of the homepage as evidence).

- [ ] **Step 4: Quick `curl` sanity check**

```bash
URL=https://hotrod.robotostudio.com
for path in / /about /services/astro /blog /blog/welcome-to-hotrod /authors /authors/jono; do
  code=$(/usr/bin/curl -s -o /dev/null -w "%{http_code}" "$URL$path")
  echo "$code  $path"
done
```

Expected: seven `200`s.

- [ ] **Step 5: Wait-for-confirmation gate**

STOP. Confirm with the user that the live site looks right. Only proceed to Task 13 (next-up.md update) after the user signs off.

---

## Task 13: Mark Phase 2 complete in `docs/next-up.md`

**Files:**
- Modify: `/Users/jono/dev/hotrod/docs/next-up.md`

- [ ] **Step 1: Read the current file**

Heading list (run `grep -n '^## ' docs/next-up.md` to verify): `Where we are`, `Conventions to respect`, `Phase 1 — Deploy to Vercel ✅`, `Phase 2 — Media support`, `Phase 3 — Agent-facing docs (\`CLAUDE.md\`)`, `Optional / nice-to-have (not on the path)`, `Copyable kickoff prompt`.

After this task the structure becomes: `Where we are`, `Conventions to respect`, `Phase 1 ✅`, **`Phase 2 — Visual identity + chrome ✅`** (new, in this position), **`Phase 3 — Pagebuilder blocks for pages`** (new), **`Phase 4 — Media support`** (was Phase 2), **`Phase 5 — Agent-facing docs (CLAUDE.md)`** (was Phase 3), `Optional / nice-to-have`, `Copyable kickoff prompt`.

- [ ] **Step 2: Update the "Where we are" intro line**

Find this line near the top of the file:

```
The first content pass and Phase 1 (Vercel deploy) are shipped on `main`. Production: https://hotrod.robotostudio.com.
```

Replace with:

```
Phases 1 (Vercel deploy) and 2 (visual identity) are shipped on `main`. Production: https://hotrod.robotostudio.com.
```

- [ ] **Step 3: Insert the new Phase 2 section**

Immediately after the existing `## Phase 1 — Deploy to Vercel ✅` block (after its last line `Plan: \`docs/superpowers/plans/2026-05-12-vercel-deploy.md\``) and before the next `## ` heading, insert:

```markdown

## Phase 2 — Visual identity + chrome ✅

Shipped 2026-05-12. Hotrod's brand is now live: yellow + black palette, Geist via Astro's fonts API, checkerboard divider, black header strip with HOTROD wordmark, black footer.

What landed:
- `src/styles/global.css` holds the trimmed shadcn-style token system (no dark mode, no chart/sidebar tokens) and `@tailwindcss/typography` prose overrides for yellow.
- `astro.config.mjs` wires the Astro 6 fonts API with `fontProviders.fontsource()` for Geist + Geist Mono.
- `src/layouts/base-layout.astro` provides the new chrome; per-route layouts (page/post/author) carry the inner `max-w-3xl` container.
- `src/components/checkerboard-divider.astro` ports the taxi repo's `checkerboard-divider.tsx` directly.
- README has a new "Design" section documenting the token system, fonts, and chrome.

Spec: `docs/superpowers/specs/2026-05-12-visual-identity-design.md`
Plan: `docs/superpowers/plans/2026-05-12-visual-identity.md`
```

- [ ] **Step 4: Replace the old Phase 2/3 sections with the new Phase 3/4/5 sections**

Find the current `## Phase 2 — Media support` heading and the `## Phase 3 — Agent-facing docs (\`CLAUDE.md\`)` heading. Together these two sections (from `## Phase 2 — Media support` up to but NOT including `## Optional / nice-to-have`) need to be replaced with three new sections — Phase 3 (pagebuilder), Phase 4 (media, the former Phase 2), Phase 5 (CLAUDE.md, the former Phase 3).

Replace that whole block with this exact content:

```markdown
## Phase 3 — Pagebuilder blocks for `pages` collection

**Why next:** the design system is live, so block components can be designed against real visual context rather than imagined.

**Scope (text-only spec, agree before implementing):**
- Convert the `pages` content collection to a block-composed model: frontmatter carries a strict-Zod-validated discriminated-union `blocks: [...]` array; the MDX body becomes optional or unused for pages.
- Initial block set (informed by the source taxi-landing-page repo): hero, feature-grid, pricing-card, cta, checkerboard-divider (already exists as a chrome component — also exposed as a block), section-heading.
- Renderer in `src/pages/[...slug].astro` walks the blocks array and dispatches each entry to the corresponding component.
- Decide: icon strategy (lucide-astro vs raw SVG vs none) — driven by what blocks actually need.
- Rewrite `src/content/pages/index.mdx`, `src/content/pages/about.mdx`, `src/content/pages/services/astro.mdx` to use blocks. Add a new `/contact` page.

**Out of scope:** any change to `blog` or `authors` schemas; image blocks (those wait for Phase 4 media support); CMS integration; admin UI.

## Phase 4 — Media support

**Why fourth:** the storage convention is set and the schemas are the contract — image/video is the next major capability, and once Phase 3's pagebuilder exists, image-bearing blocks (e.g. hero with background image) become possible.

**Scope (text-only spec, agree before implementing):**
- Add optional `heroImage` (blob key) to `blog`, `avatar` (blob key) to `authors`, and a generic `image` reference type for inline MDX/block use.
- Create a small `<BlobImage>` component that resolves a blob key → public URL via `@vercel/blob`'s URL helpers, with width/aspect props.
- Create a `<MuxVideo>` component wrapping `@mux/mux-player` with playback ID + lazy-load defaults.
- Decide: do we want a manifest of approved blob keys (so an agent can't reference a nonexistent blob) or trust the build to 404 at runtime? Lean toward a manifest for the Hotrod audience.
- Update the README's Media section to show usage examples.

**Out of scope:** image transformation pipeline, CDN config, video transcoding controls. Treat Mux + Blob as black boxes.

## Phase 5 — Agent-facing docs (`CLAUDE.md`)

**Why fifth:** ergonomics multiplier for everyone using the starter via an agent, and only meaningful once Phases 2–4 are real.

**Scope:**
- Root-level `CLAUDE.md` covering: how content is structured, frontmatter schemas, where to put new posts/authors/pages, the kebab-case + strict-Zod rules, how to use design tokens and blocks (Phase 2–3), how to add media (Phase 4), and what *not* to do (don't drop binaries in `/public`, don't add fields without updating the schema).
- A short "When the build fails, here's how to read the error" section pointing at the custom Zod messages.

**Out of scope:** generic Astro docs (link to Astro instead). This is a Hotrod-specific orientation.
```

- [ ] **Step 5: Verify heading order**

Run: `grep -n '^## ' /Users/jono/dev/hotrod/docs/next-up.md`

Expected (in order): `Where we are`, `Conventions to respect`, `Phase 1 — Deploy to Vercel ✅`, `Phase 2 — Visual identity + chrome ✅`, `Phase 3 — Pagebuilder blocks for \`pages\` collection`, `Phase 4 — Media support`, `Phase 5 — Agent-facing docs (\`CLAUDE.md\`)`, `Optional / nice-to-have (not on the path)`, `Copyable kickoff prompt`.

- [ ] **Step 6: Commit and push**

```bash
git add docs/next-up.md
git commit -m "$(cat <<'EOF'
Mark Phase 2 complete and reshuffle roadmap

Phase 2 (visual identity) ✅. Inserts Phase 3 (pagebuilder for
pages collection), bumps the former Phase 2 (media) to Phase 4
and Phase 3 (CLAUDE.md) to Phase 5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git push origin main
```

Expected: push succeeds. Vercel kicks off a no-op rebuild (docs-only). That's expected.

---

## Reminders

These don't belong in any task because they're not agent-actionable, but they're worth surfacing once Phase 2 is shipped:

1. **Take a fresh screenshot of the homepage** if you want one for marketing/social. The old `homepage.png` and `hotrod-home.png` were removed in Task 9. Any replacement should go in `public/` (or external storage) and be referenced explicitly.
2. **Watch for Astro fonts API changes.** The feature is recent. If a future Astro 6.x minor reshapes the API, the upgrade is one config edit — but be aware before doing a `pnpm update astro`.

---

## Self-review notes

**Spec coverage:**

- Trimmed token system in `global.css` → Task 2 ✓
- Astro fonts API with fontsource → Task 1 (config) + Task 4 (`<Font />` in layout) ✓
- CheckerboardDivider Astro component → Task 3 ✓
- Base layout chrome reskin → Task 4 ✓
- Page/post/author layout touch-ups → Tasks 5, 6, 7 ✓
- `post-meta` typography → Task 8 ✓
- Delete stale screenshots → Task 9 ✓
- README "Design" section → Task 10 ✓
- Local + production verification → Tasks 11, 12 ✓
- `docs/next-up.md` phase reshuffle + Phase 2 close-out → Task 13 ✓
- Out-of-scope items (no content/schema/route changes) → respected by leaving `src/content/**`, `src/content.config.ts`, `src/pages/**` untouched ✓

**Placeholder scan:** No TBD, TODO, "implement later", "similar to Task N", "add appropriate error handling", or vague code-step descriptions. All code blocks are concrete; all commands are exact.

**Type consistency:** `CheckerboardDivider` is imported and used by the same name everywhere. `Font` is imported from `astro:assets`. The CSS variable names (`--font-sans`, `--font-mono`, `--background`, `--foreground`, etc.) match across `astro.config.mjs`, `global.css`, `base-layout.astro`, and `checkerboard-divider.astro`. The Tailwind utility classes (`bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `font-sans`) all map to tokens defined in the `@theme inline` block.

**API verification note:** The fonts API shape was verified against Astro 6.3.x docs before writing this plan. The `fonts` array is a top-level `defineConfig` option (not under `experimental`); `fontProviders` is exported from `astro/config`; the `Font` component is imported from `astro:assets`. If Astro ships a minor that moves any of these, the implementer should STOP and report rather than guess.
