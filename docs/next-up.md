# Hotrod — what's next

A short, ordered game plan for the next few sessions, plus a ready-to-paste prompt at the bottom for kicking off fresh.

## Where we are

Phases 1 (Vercel deploy) and 2 (visual identity) are shipped on `main`. Production: https://hotrod.robotostudio.com.

- Astro 6 + MDX + Tailwind v4 + `@tailwindcss/typography`.
- Three strict Zod content collections: `pages`, `blog`, `authors`. Defined in `src/content.config.ts`.
- Routes: `/`, `/about`, `/services/astro`, `/blog`, `/blog/[slug]`, `/authors`, `/authors/[slug]`.
- Reserved-slug guard, draft handling (dev preview + prod-hidden), reference integrity.
- Sample content: one author, one post, three pages.
- README documents the content workflow and the external media storage convention.

Design spec: `docs/superpowers/specs/2026-05-12-mdx-content-routes-design.md`
Implementation plan: `docs/superpowers/plans/2026-05-12-mdx-content-routes.md`

## Conventions to respect

These are persisted in agent memory; they're repeated here so anyone reading this doc has them.

- **kebab-case for every file.** Components and layouts too. Astro tags must still be capitalized in templates (`<BaseLayout>`), so the import binding is PascalCase but the filename is kebab.
- **Strict Zod everywhere.** `.strict()` on every collection schema. Custom error messages aimed at non-technical readers (the agent will surface them).
- **`public/` is chrome only.** Favicons, manifest, robots, OG fallback. Content media (images, video) lives in **Vercel Blob** (images) and **Mux** (video). Schemas reference external storage, not local paths.
- **No tests framework** is configured. Verification is `pnpm astro check` (types) + `pnpm build` (route generation + schema validation) + Playwright smoke. Don't add vitest unless a real need shows up.

## Phase 1 — Deploy to Vercel ✅

Shipped 2026-05-12. Production at https://hotrod.robotostudio.com.

What landed:
- `@astrojs/vercel` adapter installed in static mode with `imageService: true`.
- Vercel project `roboto-pro/hotrod` wired to GitHub for auto-deploys; `main` → production.
- `.env.example` + hardened `.gitignore`; canonical env store is Vercel.
- README "Deploying" section documents the workflow.

Spec: `docs/superpowers/specs/2026-05-12-vercel-deploy-design.md`
Plan: `docs/superpowers/plans/2026-05-12-vercel-deploy.md`

## Phase 2 — Visual identity + chrome ✅

Shipped 2026-05-13. Hotrod's brand is now live: yellow + black palette, Geist via Astro's fonts API, checkerboard divider, black header strip with HOTROD wordmark, black footer.

What landed:
- `src/styles/global.css` holds the trimmed shadcn-style token system (no dark mode, no chart/sidebar tokens) and `@tailwindcss/typography` prose overrides for yellow.
- `astro.config.mjs` wires the Astro 6 fonts API with `fontProviders.fontsource()` for Geist + Geist Mono.
- `src/layouts/base-layout.astro` provides the new chrome; per-route layouts (page/post/author) carry the inner `max-w-3xl` container.
- `src/components/checkerboard-divider.astro` ports the taxi repo's `checkerboard-divider.tsx` directly.
- README has a new "Design" section documenting the token system, fonts, and chrome.

Spec: `docs/superpowers/specs/2026-05-12-visual-identity-design.md`
Plan: `docs/superpowers/plans/2026-05-12-visual-identity.md`

## Phase 3 — Pagebuilder blocks for `pages` collection

**Why next:** the design system is live, so block components can be designed against real visual context rather than imagined.

**Framework tickets (filed 2026-05-13, Hotrod project):**
- ROB-1993 — Add pagebuilder framework (block-composed pages). Commits to **frontmatter blocks**, not JSX-in-body — chosen for strict Zod validation with custom error messages aimed at non-technical authors. Introduces `<PageSections>` wrapper as the single source of inter-block layout.
- ROB-1994 — Pick icon strategy and define named icon set.
- ROB-1995 — Migrate existing pages to block-composed model and add /contact.

**Block tickets (filed 2026-05-13, Hotrod project):**
- ROB-1982 — navigation-bar
- ROB-1983 — hero
- ROB-1984 — figures
- ROB-1985 — card-grid (Our Services)
- ROB-1986 — feature-strip (Why Choose Us)
- ROB-1987 — pricing
- ROB-1988 — cta-banner
- ROB-1989 — footer

Each block ticket has its v0 source screenshot inline and the `jonoroboto/v0-taxi-landing-page` repo attached. Universal prop nomenclature (`title`, `text`, `buttons`) and inline `==highlight==` syntax established in the hero ticket apply to every block.

**Dependency graph:** ROB-1993 blocks the 8 block tickets (each needs the renderer for its smoke check). ROB-1994 blocks ROB-1983 / ROB-1985 / ROB-1986 (icon-using blocks). ROB-1995 is blocked by all of the above.

**Out of scope:** any change to `blog` or `authors` schemas; image blocks (those wait for the media work below); CMS integration; admin UI.

## Phase 4 — Media support

**Why fourth:** the storage convention is set and the schemas are the contract — image/video is the next major capability, and once Phase 3's pagebuilder exists, image-bearing blocks (e.g. hero with background image) become possible.

**Linear tickets (filed 2026-05-13, Hotrod project):**
- ROB-1990 — Add Vercel Blob image support (`heroImage`, `avatar`, inline `image` ref, `<BlobImage>` component)
- ROB-1991 — Add Mux video support (`<MuxVideo>` component wrapping `@mux/mux-player`, inline `video` ref)
- ROB-1992 — Validate blob keys against a build-time manifest (blocked by ROB-1990)

**Out of scope:** image transformation pipeline, CDN config, video transcoding controls. Treat Mux + Blob as black boxes.

## Phase 5 — Agent-facing docs (`CLAUDE.md`)

**Why fifth:** ergonomics multiplier for everyone using the starter via an agent, and only meaningful once Phases 2–4 are real.

**Scope:**
- Root-level `CLAUDE.md` covering: how content is structured, frontmatter schemas, where to put new posts/authors/pages, the kebab-case + strict-Zod rules, how to use design tokens and blocks (Phase 2–3), how to add media (Phase 4), and what *not* to do (don't drop binaries in `/public`, don't add fields without updating the schema).
- A short "When the build fails, here's how to read the error" section pointing at the custom Zod messages.

**Out of scope:** generic Astro docs (link to Astro instead). This is a Hotrod-specific orientation.

**Linear ticket:** ROB-1996 — Add agent-facing CLAUDE.md at repo root. Blocked by ROB-1993 (framework), ROB-1995 (page migration), ROB-1990 (Blob image), ROB-1991 (Mux video).

## Optional / nice-to-have (not on the path)

- **Typography backtick fix** — ROB-1997. `@tailwindcss/typography` adds literal `` ` `` around inline `<code>` via `::before/::after`. CSS override in `global.css`.
- **Tailwind theme** — ROB-1998. Slot in via Tailwind v4's `@theme` block in `global.css`; no component changes.
- **RSS feed, sitemap, tag pages, pagination, search.** All deferred per the spec's non-goals. The data is already in the schemas for whenever they're useful. Not yet ticketed.

## Tooling notes (for fresh sessions)

- **Linear MCP** is available; check `list_teams`/`save_issue` for any new tickets.
- **`writing-linear-tickets` skill** — house ticket convention. Drafted at `~/dev/skills/skills/writing-linear-tickets/` and PR'd at https://github.com/robotostudio/skills/pull/1.
- **`~/.local/bin/linear-upload.py`** — uploads a local image as an inline screenshot at the top of a Linear ticket's description. Usage: `python3 ~/.local/bin/linear-upload.py <path-to-png> <ROB-XXXX> "<alt text>"`. Reads `~/.linear-api-key` (already populated; rotate it if it's been compromised).

---

## Copyable kickoff prompt

Paste this at the start of a fresh session in `/Users/jono/dev/hotrod`:

> I'm continuing work on Hotrod (`/Users/jono/dev/hotrod`), Roboto Studio's agent-first Astro starter. Phases 1 (Vercel deploy) and 2 (visual identity) are shipped on `main`. Tickets are filed in the Hotrod Linear project for Phase 3 (pagebuilder framework + blocks, ROB-1982 – ROB-1989, ROB-1993 – ROB-1995), Phase 4 (media, ROB-1990 – ROB-1992), Phase 5 (CLAUDE.md, ROB-1996), and the optional items (ROB-1997, ROB-1998). The full state — including the dependency graph — is in `docs/next-up.md`. Read it first.
>
> Conventions to respect: kebab-case filenames everywhere, strict Zod schemas with human-readable error messages, `public/` is chrome only (content media goes to Vercel Blob / Mux). Pages use the frontmatter-driven `blocks: [...]` model (committed to in ROB-1993). For any new tickets, follow the `writing-linear-tickets` skill at `~/dev/skills/skills/writing-linear-tickets/SKILL.md`.
>
> The right starting point is ROB-1993 (pagebuilder framework) — it unblocks every block ticket. Walk me through the brainstorming questions before touching code; once we've agreed, write a short spec under `docs/superpowers/specs/`, then a plan under `docs/superpowers/plans/`, then implement.
