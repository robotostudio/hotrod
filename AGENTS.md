# AGENTS.md — Hotrod

Hotrod is Roboto Studio's agent-first Astro starter: an Astro 6 + MDX +
Tailwind v4 marketing site where pages are built from Zod-typed blocks in
frontmatter. This file is the rulebook for any agent working here. Cursor,
Codex, Copilot, v0 and most other tools read it directly; Claude Code reads it
through `CLAUDE.md`.

## Golden rules

1. **Compose before you extend.** Most requests are content: fill existing
   blocks in a page's `blocks:` list. Touch `src/blocks/` only when no block
   can express the content.
2. **Strict Zod everywhere.** Every schema is `.strict()` and every field has a
   plain-English error message. When content fails validation, fix the
   content; never loosen the schema to make it pass.
3. **`public/` is chrome only** (favicon, robots.txt). Content images go to
   Vercel Blob and are referenced by key; video goes to Mux and is referenced
   by playback ID. The build checks both exist.
4. **Design tokens only.** Colours come from `src/styles/global.css`. No hex
   codes or palette classes in components.
5. **kebab-case filenames** for everything, including `.astro` files. Import
   bindings stay PascalCase (`import SiteNav from './site-nav.astro'`).
6. **The build is the gate, then look.** `pnpm build` runs every schema. A
   green build is not done: open the page in `pnpm dev` and check it at phone
   and desktop width.
7. **`main` deploys to production.** Work on a branch and open a pull request;
   never push to `main`. Every other branch gets a Vercel preview.

## Where things live

| What | Path |
|---|---|
| Pages (MDX, URL = file path) | `src/content/pages/**/*.mdx` |
| Blog posts | `src/content/blog/*.mdx` |
| Authors | `src/content/authors/*.mdx` |
| Frontmatter schemas | `src/content.config.ts` |
| Blocks (schema + component per folder) | `src/blocks/<name>/{schema.ts,index.astro}` |
| Block registry | `src/blocks/registry.ts` |
| Shared block fields (button, image, video) | `src/blocks/_shared/` |
| Shared components (icons, dividers, media) | `src/components/` |
| Header and footer links (hard-coded) | `src/components/site-nav.astro`, `src/components/site-footer.astro` |
| Layouts and site chrome | `src/layouts/` |
| Page routing (blocks vs prose) | `src/pages/[...slug].astro` |
| Design tokens | `src/styles/global.css` |
| Blob and Mux manifests (generated at build, gitignored) | `src/generated/` |

## Skills

Step-by-step procedures live in `.claude/skills/`. Read the one that matches
the task before starting.

| Skill | Use it for |
|---|---|
| `.claude/skills/compose-page/SKILL.md` | Adding or editing a page or blog post: finding the file, frontmatter rules, the block catalog, field shapes, and how to validate. |
| `.claude/skills/compose-block/SKILL.md` | Creating or changing a block or any visible component: the folder contract, registry, shared parts, and the design rules every block follows. |
| `.claude/skills/write-a-skill/SKILL.md` | Asked to remember a rule or save a convention: write it here as a skill so every agent gets it, then add a row to this table. |

## Commands

| Command | Does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dlx vercel env pull .env.local` | Pull env vars. The Development env holds `BLOB_READ_WRITE_TOKEN` only; `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are in Production (`--environment=production`) and must be added to `.env.local` too. `dev`, `build` and `astro check` fail without all three. |
| `pnpm dev` | Dev server at `http://localhost:4321`, drafts included |
| `pnpm build` | Production build; validates every page |
| `pnpm astro check` | Type check |

There is no test framework. Verification is `pnpm astro check`, `pnpm build`
and looking at the page.

## When the build fails

Zod errors name the file, the field path and what was expected, for example
`` `hero.buttons` can contain at most three buttons. `` Fix the content the
message points at. A Blob or Mux error means the key or playback ID does not
exist in that account: upload the asset, or correct the reference.
