# Hotrod

[Roboto Studio](https://robotostudio.com/services/agentic-websites)'s open-source, agent-first website starter. Built on [Astro](https://astro.build/) and tailored for sites that are built, edited, and maintained primarily by coding agents.

> Heads up: Hotrod assumes you are driving development through an agent (Claude Code, Cursor, etc.). Conventions, scripts, and project structure are tuned for that workflow rather than hand-editing.

## Getting started

```sh
pnpm install
pnpm dev
```

The dev server runs at `http://localhost:4321`.

## Project structure

```text
/
├── public/
├── src/
│   ├── components/
│   ├── content/
│   │   ├── authors/
│   │   ├── blog/
│   │   └── pages/
│   ├── content.config.ts
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   └── styles/
├── astro.config.mjs
└── package.json
```

Static assets live in `public/`. Content lives in `src/content/`. Routes in `src/pages/` query the content collections and render them through the layouts in `src/layouts/`.

## Content

All site content lives under `src/content/` and is validated by strict Zod schemas defined in `src/content.config.ts`.

| Collection | Path | URL pattern |
| --- | --- | --- |
| `pages` | `src/content/pages/**/*.mdx` | `/`, `/about`, `/services/astro`, … |
| `blog` | `src/content/blog/*.mdx` | `/blog/[slug]` |
| `authors` | `src/content/authors/*.mdx` | `/authors/[slug]` |

The dev server reflects new entries automatically. Drafts (`draft: true`) render in development but are excluded from production builds.

If you typo a frontmatter key, omit a required field, or reference an author that doesn't exist, the build fails with a clear error. This is intentional — Hotrod is built to be driven by an agent on behalf of a non-technical user, and silent failures are worse than loud ones.

## Media

Content media (post hero images, author avatars, embedded video) is **not** stored in the repo.

- Images → [Vercel Blob](https://vercel.com/docs/vercel-blob)
- Video → [Mux](https://mux.com/)

`public/` is reserved for site chrome only: the favicon SVG and `robots.txt`. Other icon assets (`apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) and the web manifest are rendered at build time from `src/lib/icon-image.ts` so the design stays in sync with the favicon. Frontmatter fields that point at media reference external storage (blob keys or Mux playback IDs), not local file paths.

## SEO and social

Every page gets full meta tags, an auto-generated Open Graph image, JSON-LD structured data, and entries in `sitemap-index.xml` / `rss.xml`. There's no per-page configuration to wire — the layouts do it from frontmatter.

### The contract per page

| Field | Required | Used in |
| :--- | :--- | :--- |
| `title` | yes | `<title>`, og:title, OG image text |
| `description` | yes (80–220 chars) | On-page lede, `<meta name="description">`, og:description |
| `metaDescription` | optional override | Wins over `description` for meta tags only — use when the on-page intro doesn't make a great SERP snippet |

Length rules are enforced by Zod in `src/content.config.ts`. A description under 80 chars or over 220 fails the build with a clear message. Aim for 120–160; that's the sweet spot Google won't truncate or rewrite.

### Open Graph images

Every page has an auto-generated 1200×630 PNG at `/og/<slug>.png`, rendered by [Takumi](https://takumi.kane.tw/) from `src/lib/og-image.ts`:

- Home → centred "CALL 1800 HOT ROD" brand banner with chequer on top and bottom.
- Everything else → title bottom-left in black on yellow, chequer strip below.

The base layout points `og:image` and `twitter:image` at the right slug automatically. No frontmatter required.

### Other things baked in

- `sitemap-index.xml` (via `@astrojs/sitemap`) — OG image routes filtered out.
- `rss.xml` (via `@astrojs/rss`) — all published blog posts, newest first.
- `robots.txt` — explicit allow for AI crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.) plus a sitemap pointer. Edit `public/robots.txt` to opt out.
- JSON-LD — `Article` on blog posts, `WebSite` + `Organization` on home, `Person` on author pages, `WebPage` everywhere else.
- `manifest.webmanifest`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` — rendered from the same checker design as the favicon.
- Markdown twins — every blog post has a `/blog/<slug>.md` companion for agents and `llms.txt` / `llms-full.txt` indices.

## Design

Hotrod's visual identity is a yellow-cab-themed brand: bold typography, a black-and-yellow palette, and a checkerboard divider as recurring chrome.

### Palette and tokens

All design tokens live in `src/styles/global.css`. The structure mirrors shadcn/ui's CSS-custom-property pattern but trimmed to what Hotrod actually uses — no dark mode, no chart or sidebar tokens. To change the palette, edit the `:root` block; the `@theme inline` block re-exposes those values to Tailwind so utilities like `bg-background` and `text-foreground` stay in sync.

### Fonts

Geist and Geist Mono are loaded via Astro 6's [fonts API](https://docs.astro.build/en/guides/fonts/) with the `fontsource` provider, configured in `astro.config.mjs`. The base layout includes `<Font cssVariable="--font-sans" preload />` so the sans font preloads on every page.

### Brand chrome

The black header strip with `HOTROD` wordmark, the `<CheckerboardDivider />` underneath, and the black footer all live in `src/layouts/base-layout.astro`. Inner content max-widths live in the per-route layouts (`page-layout.astro`, `post-layout.astro`, `author-layout.astro`).

## Commands

All commands run from the project root.

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `pnpm install`    | Install dependencies                         |
| `pnpm dev`        | Start the local dev server at `localhost:4321` |
| `pnpm build`      | Build the production site to `./dist/`       |
| `pnpm preview`    | Preview the production build locally         |
| `pnpm astro ...`  | Run Astro CLI commands (`astro add`, `astro check`, etc.) |

## Deploying

Hotrod deploys to Vercel. The production site is at [hotrod.robotostudio.com](https://hotrod.robotostudio.com).

| Branch | Result |
| :--- | :--- |
| `main` | Production deploy at `hotrod.robotostudio.com` |
| Any other branch | Preview deploy at `hotrod-git-<branch>-roboto-pro.vercel.app` |

Pushes are auto-deployed via Vercel's GitHub integration. There is no separate CI step to configure.

### Environment variables

Real env values live in the Vercel project (`roboto-pro/hotrod`) and are never committed. `.env.example` lists the key names.

To sync them locally:

```sh
pnpm dlx vercel env pull .env.local
```

This writes the current Development-environment values to `.env.local`, which is gitignored.

To add or update an env var, use the Vercel dashboard or `pnpm dlx vercel env add <NAME> <environment>` — never paste values into chat or commit them to the repo.

### Local preview of the production build

```sh
pnpm build
pnpm preview
```

`pnpm preview` serves the contents of `dist/` so you can sanity-check the production build before pushing.

## License

[MIT](LICENSE) © [Roboto Studio](https://robotostudio.com)
