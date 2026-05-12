# Hotrod

Roboto Studio's open-source, agent-first website starter. Built on [Astro](https://astro.build/) and tailored for sites that are built, edited, and maintained primarily by coding agents.

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

`public/` is reserved for site chrome only: favicons, `manifest.json`, `robots.txt`, and an Open Graph fallback image. Frontmatter fields that point at media will reference external storage (blob keys or Mux playback IDs), not local file paths.

Media support isn't wired up yet — the first content pass is text-only.

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

MIT © Roboto Studio
