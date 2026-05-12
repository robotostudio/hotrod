# MDX Content Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Hotrod's content system per `docs/superpowers/specs/2026-05-12-mdx-content-routes-design.md` — three Zod-strict MDX content collections (pages, blog, authors), routes that render them, Tailwind v4 styling, and sample content.

**Architecture:** All content lives in `src/content/<collection>/**/*.mdx`. Routes in `src/pages/` query collections through helpers in `src/lib/content.ts` that filter drafts and guard against slug shadowing. Layouts compose a single `base-layout.astro` that handles HTML shell, `<head>`, OG meta, and global styles.

**Tech Stack:** Astro 6, @astrojs/mdx, Tailwind v4 via @tailwindcss/vite, @tailwindcss/typography, pnpm.

**Verification approach:** This is a content starter — no test framework is added. Each task verifies by either (a) `pnpm build` succeeding with sample content, (b) `pnpm astro check` passing, or (c) Playwright smoke-rendering specific pages. The final task verifies each strict-validation guardrail by temporarily breaking sample content and confirming the build fails with a clear error.

---

## Task 1: Install dependencies and configure Astro

**Files:**
- Modify: `package.json`
- Modify: `astro.config.mjs`
- Create: `src/styles/global.css`

- [ ] **Step 1: Install MDX, Tailwind v4, and the typography plugin**

Run:
```bash
pnpm add @astrojs/mdx tailwindcss @tailwindcss/vite @tailwindcss/typography
```

- [ ] **Step 2: Replace `astro.config.mjs` with the integrated config**

Write `astro.config.mjs`:
```js
// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 3: Create the global stylesheet**

Write `src/styles/global.css`:
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

- [ ] **Step 4: Sanity-check the build**

Run:
```bash
pnpm astro check
```

Expected: 0 errors. (`astro check` may warn about no content collections yet — that's fine; we add them in Task 3.)

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml astro.config.mjs src/styles/global.css
git commit -m "Add MDX integration and Tailwind v4"
```

---

## Task 2: Add the date-formatting helper

**Files:**
- Create: `src/lib/format-date.ts`

- [ ] **Step 1: Write the helper**

Write `src/lib/format-date.ts`:
```ts
const FORMATTER = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatDate(date: Date): string {
  return FORMATTER.format(date);
}
```

- [ ] **Step 2: Verify types**

Run:
```bash
pnpm astro check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/format-date.ts
git commit -m "Add formatDate helper"
```

---

## Task 3: Define the three content collections

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Write the schema file**

Write `src/content/config.ts`:
```ts
import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const dateMessage = (field: string) =>
  `\`${field}\` must be a valid ISO date, e.g. 2026-05-12.`;

const requiredString = (field: string) =>
  z
    .string({ message: `\`${field}\` is required.` })
    .min(1, { message: `\`${field}\` must not be empty.` });

const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z
    .object({
      title: requiredString('title'),
      description: requiredString('description'),
      publishedAt: z.coerce.date({ message: dateMessage('publishedAt') }),
      updatedAt: z.coerce.date({ message: dateMessage('updatedAt') }).optional(),
      draft: z.boolean().default(false),
    })
    .strict(),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z
    .object({
      title: requiredString('title'),
      description: requiredString('description'),
      publishedAt: z.coerce.date({ message: dateMessage('publishedAt') }),
      updatedAt: z.coerce.date({ message: dateMessage('updatedAt') }).optional(),
      author: reference('authors'),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    })
    .strict(),
});

const authors = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/authors' }),
  schema: z
    .object({
      name: requiredString('name'),
      role: z.string().optional(),
      shortBio: requiredString('shortBio'),
      social: z
        .object({
          twitter: z.string().optional(),
          github: z.string().optional(),
          linkedin: z.string().optional(),
          website: z.string().url({ message: '`social.website` must be a URL.' }).optional(),
        })
        .strict()
        .default({}),
      publishedAt: z.coerce.date({ message: dateMessage('publishedAt') }),
      updatedAt: z.coerce.date({ message: dateMessage('updatedAt') }).optional(),
    })
    .strict(),
});

export const collections = { pages, blog, authors };
```

- [ ] **Step 2: Verify config parses**

Run:
```bash
pnpm astro check
```

Expected: 0 errors. (Astro will report no entries yet — collections are empty until Task 4.)

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts
git commit -m "Add strict content collection schemas"
```

---

## Task 4: Add sample author, post, and pages

**Files:**
- Create: `src/content/authors/jono.mdx`
- Create: `src/content/blog/welcome-to-hotrod.mdx`
- Create: `src/content/pages/index.mdx`
- Create: `src/content/pages/about.mdx`
- Create: `src/content/pages/services/astro.mdx`

- [ ] **Step 1: Create the sample author**

Write `src/content/authors/jono.mdx`:
```mdx
---
name: "Jono"
role: "Founder, Roboto Studio"
shortBio: "Builds open-source tools for agent-driven websites."
social:
  github: "jonoroboto"
  website: "https://robotostudio.com"
publishedAt: 2026-05-12
---

Jono runs Roboto Studio and builds Hotrod — the agent-first Astro starter.
He writes about agent-driven workflows, modern web tooling, and the messy
middle between design and code.
```

- [ ] **Step 2: Create the sample blog post**

Write `src/content/blog/welcome-to-hotrod.mdx`:
```mdx
---
title: "Welcome to Hotrod"
description: "An agent-first Astro starter from Roboto Studio."
publishedAt: 2026-05-12
author: jono
tags:
  - "starter"
  - "agents"
---

Hotrod is an open-source Astro starter built for sites that are designed,
written, and maintained by coding agents.

This first post exists so the dev server boots into something real. Every
piece of content on this site — including marketing pages, author profiles,
and posts — lives as an MDX file under `src/content/`. The frontmatter is
validated by strict Zod schemas, so an agent (or a human editor) gets a
loud, clear error the moment something is wrong.
```

- [ ] **Step 3: Create the homepage page entry**

Write `src/content/pages/index.mdx`:
```mdx
---
title: "Hotrod"
description: "Roboto Studio's open-source, agent-first Astro starter."
publishedAt: 2026-05-12
---

Hotrod is an open-source Astro starter from Roboto Studio, built for
sites that are designed, written, and maintained primarily by coding
agents.

This page is itself a content entry — `src/content/pages/index.mdx`. Edit
it, the marketing pages under `src/content/pages/`, the posts under
`src/content/blog/`, or the author profiles under `src/content/authors/`,
and the routes update automatically.
```

- [ ] **Step 4: Create the sample top-level marketing page**

Write `src/content/pages/about.mdx`:
```mdx
---
title: "About Hotrod"
description: "Why Hotrod exists and what it ships with."
publishedAt: 2026-05-12
---

Hotrod is an opinionated Astro starter with three content collections —
pages, blog, and authors — wired up with strict frontmatter validation
and built for agent-driven editing.

Replace this page with your own about copy whenever you want.
```

- [ ] **Step 5: Create the sample nested marketing page**

Write `src/content/pages/services/astro.mdx`:
```mdx
---
title: "Astro websites"
description: "We build content-first Astro sites for agent-driven teams."
publishedAt: 2026-05-12
---

We design and build content-first Astro websites that play well with the
new generation of coding agents. Strict schemas, predictable routes, and
zero surprise — so the agent doing the writing doesn't fight the platform.

This page lives at `src/content/pages/services/astro.mdx` and is served at
`/services/astro` automatically.
```

- [ ] **Step 6: Sync types and verify**

Run:
```bash
pnpm astro sync
pnpm astro check
```

Expected: 0 errors. `astro sync` regenerates `.astro/types.d.ts` so the new
collection entries are typed.

- [ ] **Step 7: Commit**

```bash
git add src/content
git commit -m "Add sample author, post, and pages"
```

---

## Task 5: Add content-query helpers

**Files:**
- Create: `src/lib/content.ts`

- [ ] **Step 1: Write the helpers**

Write `src/lib/content.ts`:
```ts
import { getCollection } from 'astro:content';

const RESERVED_PAGE_SEGMENTS = ['blog', 'authors'] as const;

function isPublished(data: { draft?: boolean }): boolean {
  if (import.meta.env.DEV) return true;
  return data.draft !== true;
}

export async function getPublishedPages() {
  const entries = await getCollection('pages', (entry) => isPublished(entry.data));
  for (const entry of entries) {
    const firstSegment = entry.id.split('/')[0];
    if ((RESERVED_PAGE_SEGMENTS as readonly string[]).includes(firstSegment)) {
      throw new Error(
        `Page "${entry.id}" would shadow the reserved route "/${firstSegment}/". ` +
          `Reserved routes: ${RESERVED_PAGE_SEGMENTS.map((s) => `/${s}`).join(', ')}. ` +
          `Move it to a different path or rename the top-level folder under src/content/pages/.`,
      );
    }
  }
  return entries;
}

export async function getPublishedPosts() {
  const posts = await getCollection('blog', (entry) => isPublished(entry.data));
  return posts.sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );
}

export async function getPublishedAuthors() {
  return getCollection('authors');
}
```

- [ ] **Step 2: Verify types**

Run:
```bash
pnpm astro check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/content.ts
git commit -m "Add content-query helpers"
```

---

## Task 6: Create the base layout

**Files:**
- Create: `src/layouts/base-layout.astro`

- [ ] **Step 1: Write the base layout**

Write `src/layouts/base-layout.astro`:
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

- [ ] **Step 2: Verify types**

Run:
```bash
pnpm astro check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/base-layout.astro
git commit -m "Add base layout with OG meta and shared chrome"
```

---

## Task 7: Create the post-meta component and three content layouts

**Files:**
- Create: `src/components/post-meta.astro`
- Create: `src/layouts/page-layout.astro`
- Create: `src/layouts/post-layout.astro`
- Create: `src/layouts/author-layout.astro`

- [ ] **Step 1: Create the post-meta component**

Write `src/components/post-meta.astro`:
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

- [ ] **Step 2: Create the page layout**

Write `src/layouts/page-layout.astro`:
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

- [ ] **Step 3: Create the post layout**

Write `src/layouts/post-layout.astro`:
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

- [ ] **Step 4: Create the author layout**

Write `src/layouts/author-layout.astro`:
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

- [ ] **Step 5: Verify types**

Run:
```bash
pnpm astro check
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/components src/layouts/page-layout.astro src/layouts/post-layout.astro src/layouts/author-layout.astro
git commit -m "Add page, post, and author layouts plus post-meta"
```

---

## Task 8: Replace `src/pages/index.astro` with the catch-all route

**Files:**
- Delete: `src/pages/index.astro`
- Create: `src/pages/[...slug].astro`

- [ ] **Step 1: Delete the hand-coded homepage**

Run:
```bash
git rm src/pages/index.astro
```

- [ ] **Step 2: Create the catch-all route**

Write `src/pages/[...slug].astro`:
```astro
---
import PageLayout from '../layouts/page-layout.astro';
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
const { Content } = await render(entry);
const { title, description, publishedAt, updatedAt } = entry.data;
---

<PageLayout
  title={title}
  description={description}
  publishedAt={publishedAt}
  updatedAt={updatedAt}
>
  <Content />
</PageLayout>
```

- [ ] **Step 3: Verify the build succeeds**

Run:
```bash
pnpm build
```

Expected: build completes; output mentions building `/`, `/about`, and `/services/astro`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/[...slug].astro
git commit -m "Replace index.astro with collection-driven catch-all route"
```

---

## Task 9: Add the blog routes

**Files:**
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[slug].astro`

- [ ] **Step 1: Create the blog index**

Write `src/pages/blog/index.astro`:
```astro
---
import BaseLayout from '../../layouts/base-layout.astro';
import { getPublishedPosts } from '../../lib/content';
import { formatDate } from '../../lib/format-date';

const posts = await getPublishedPosts();
---

<BaseLayout title="Blog" description="Writing from the Hotrod team.">
  <article class="prose prose-slate">
    <h1>Blog</h1>
  </article>
  <ul class="mt-8 space-y-6">
    {posts.map((post) => (
      <li>
        <a href={`/blog/${post.id}`} class="text-xl font-semibold hover:underline">
          {post.data.title}
        </a>
        <p class="text-sm text-slate-500">{formatDate(post.data.publishedAt)}</p>
        <p class="mt-1 text-slate-700">{post.data.description}</p>
      </li>
    ))}
  </ul>
</BaseLayout>
```

- [ ] **Step 2: Create the blog post route**

Write `src/pages/blog/[slug].astro`:
```astro
---
import PostLayout from '../../layouts/post-layout.astro';
import { getPublishedPosts } from '../../lib/content';
import { getEntry, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const author = await getEntry(post.data.author);
if (!author) {
  throw new Error(
    `Post "${post.id}" references author "${post.data.author.id}" which does not exist in src/content/authors/.`,
  );
}
const { Content } = await render(post);
const { title, description, publishedAt, updatedAt } = post.data;
---

<PostLayout
  title={title}
  description={description}
  publishedAt={publishedAt}
  updatedAt={updatedAt}
  author={author}
>
  <Content />
</PostLayout>
```

- [ ] **Step 3: Verify the build succeeds**

Run:
```bash
pnpm build
```

Expected: build output includes `/blog/` and `/blog/welcome-to-hotrod`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog
git commit -m "Add blog index and post routes"
```

---

## Task 10: Add the author routes

**Files:**
- Create: `src/pages/authors/index.astro`
- Create: `src/pages/authors/[slug].astro`

- [ ] **Step 1: Create the authors index**

Write `src/pages/authors/index.astro`:
```astro
---
import BaseLayout from '../../layouts/base-layout.astro';
import { getPublishedAuthors } from '../../lib/content';

const authors = await getPublishedAuthors();
---

<BaseLayout title="Authors" description="People writing on Hotrod.">
  <article class="prose prose-slate">
    <h1>Authors</h1>
  </article>
  <ul class="mt-8 space-y-6">
    {authors.map((author) => (
      <li>
        <a href={`/authors/${author.id}`} class="text-xl font-semibold hover:underline">
          {author.data.name}
        </a>
        {author.data.role && (
          <p class="text-sm uppercase tracking-wide text-slate-500">{author.data.role}</p>
        )}
        <p class="mt-1 text-slate-700">{author.data.shortBio}</p>
      </li>
    ))}
  </ul>
</BaseLayout>
```

- [ ] **Step 2: Create the author detail route**

Write `src/pages/authors/[slug].astro`:
```astro
---
import AuthorLayout from '../../layouts/author-layout.astro';
import { getPublishedAuthors, getPublishedPosts } from '../../lib/content';
import { render } from 'astro:content';

export async function getStaticPaths() {
  const [authors, posts] = await Promise.all([
    getPublishedAuthors(),
    getPublishedPosts(),
  ]);
  return authors.map((author) => ({
    params: { slug: author.id },
    props: {
      author,
      posts: posts.filter((post) => post.data.author.id === author.id),
    },
  }));
}

const { author, posts } = Astro.props;
const { Content } = await render(author);
---

<AuthorLayout author={author} posts={posts}>
  <Content />
</AuthorLayout>
```

- [ ] **Step 3: Verify the build succeeds**

Run:
```bash
pnpm build
```

Expected: build output includes `/authors/` and `/authors/jono`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/authors
git commit -m "Add author index and detail routes"
```

---

## Task 11: Smoke-test the running site

**Files:** none — verification only.

- [ ] **Step 1: Start the dev server**

Run (in background or another terminal):
```bash
pnpm dev
```

Expected: server reports ready at `http://localhost:4321/`.

- [ ] **Step 2: Verify every route renders**

Using a browser or Playwright, load each of these and confirm a 200 plus the expected `<h1>`:

| URL | Expected `<h1>` |
| --- | --- |
| `/` | "Hotrod" |
| `/about` | "About Hotrod" |
| `/services/astro` | "Astro websites" |
| `/blog` | "Blog" |
| `/blog/welcome-to-hotrod` | "Welcome to Hotrod" |
| `/authors` | "Authors" |
| `/authors/jono` | "Jono" |

Also verify the byline on `/blog/welcome-to-hotrod` links to `/authors/jono`, and that `/authors/jono` lists the welcome post.

- [ ] **Step 3: Verify a production build**

Stop the dev server, then run:
```bash
pnpm build
```

Expected: build completes, the `dist/` output contains every route from Step 2, no warnings about broken references.

- [ ] **Step 4: No code changes to commit**

This task is verification only — nothing to commit.

---

## Task 12: Verify the strict-validation guardrails

**Files:** none persisted — each step temporarily breaks a sample file and reverts.

This task confirms the spec's build-time guarantees. For each scenario, edit a single file, run `pnpm build`, observe the named error, then revert the edit before moving on.

- [ ] **Step 1: Typo'd frontmatter key fails the build**

Edit `src/content/blog/welcome-to-hotrod.mdx` and rename `publishedAt` → `pubishedAt`.

Run:
```bash
pnpm build
```

Expected: build fails with a Zod error mentioning the unknown key `pubishedAt` (because the schema is `.strict()`).

Revert the file (`git checkout src/content/blog/welcome-to-hotrod.mdx`).

- [ ] **Step 2: Missing required field fails the build**

Edit `src/content/blog/welcome-to-hotrod.mdx` and delete the `title:` line.

Run:
```bash
pnpm build
```

Expected: build fails with the custom message "`title` is required."

Revert the file.

- [ ] **Step 3: Broken author reference fails the build**

Edit `src/content/blog/welcome-to-hotrod.mdx` and change `author: jono` to `author: ghost`.

Run:
```bash
pnpm build
```

Expected: build fails with a reference error naming `ghost` and `authors`.

Revert the file.

- [ ] **Step 4: Reserved-slug shadow fails the build**

Create `src/content/pages/blog.mdx`:
```mdx
---
title: "Shadow"
description: "Shadow."
publishedAt: 2026-05-12
---
```

Run:
```bash
pnpm build
```

Expected: build fails with the named error from `getPublishedPages` mentioning the reserved route `/blog/`.

Delete the file:
```bash
rm src/content/pages/blog.mdx
```

- [ ] **Step 5: Confirm clean state and commit a marker**

Run:
```bash
git status
```

Expected: working tree clean.

No code changes — this task is verification. Optionally append a note to `docs/superpowers/specs/2026-05-12-mdx-content-routes-design.md` recording that all four guardrails were verified manually.

---

## Task 13: Update the README to describe the content workflow

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the README**

Edit `README.md` and add a new "Content" section between "Project structure" and "Commands":

```markdown
## Content

All site content lives under `src/content/` and is validated by strict
Zod schemas defined in `src/content/config.ts`.

| Collection | Path | URL pattern |
| --- | --- | --- |
| `pages` | `src/content/pages/**/*.mdx` | `/`, `/about`, `/services/astro`, ... |
| `blog` | `src/content/blog/*.mdx` | `/blog/[slug]` |
| `authors` | `src/content/authors/*.mdx` | `/authors/[slug]` |

The dev server reflects new entries automatically. Drafts (`draft: true`)
render in development but are excluded from production builds.

If you typo a frontmatter key, omit a required field, or reference an
author that doesn't exist, the build fails with a clear error. This is
intentional — Hotrod is built to be driven by an agent on behalf of a
non-technical user, and silent failures are worse than loud ones.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Document the content workflow in the README"
```

---

## Self-review

After all tasks are complete:

1. Run `pnpm astro check` — expect 0 errors.
2. Run `pnpm build` — expect a clean build with every sample route generated.
3. Confirm `git status` is clean.
4. Push to `origin/main` when the user authorizes shipping.
