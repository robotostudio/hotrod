# Hotrod — what's next

A short, ordered game plan for the next few sessions, plus a ready-to-paste prompt at the bottom for kicking off fresh.

## Where we are

The first content pass is shipped on `main` (commit `d524533`).

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

## Phase 1 — Deploy to Vercel

**Why first:** quick win, gives a preview URL per push, and is required before Phase 2 (Vercel Blob needs a linked Vercel project).

**Scope:**
- `vercel link` and create the Vercel project pointing at `github.com/robotostudio/hotrod`.
- Confirm Astro static build deploys cleanly.
- Add a production domain when ready (deferred — preview URL is fine for now).
- No env vars needed yet — that comes in Phase 2.

**Out of scope:** any framework changes. Astro's static output already plays well with Vercel.

## Phase 2 — Media support

**Why second:** the storage convention is set and the schemas are the contract — image/video is the next major capability.

**Scope (text-only spec, agree before implementing):**
- Add optional `heroImage` (blob key) to `blog`, `avatar` (blob key) to `authors`, and a generic `image` reference type for inline MDX use.
- Create a small `<BlobImage>` component that resolves a blob key → public URL via `@vercel/blob`'s URL helpers, with width/aspect props.
- Create a `<MuxVideo>` component wrapping `@mux/mux-player` with playback ID + lazy-load defaults.
- Decide: do we want a manifest of approved blob keys (so an agent can't reference a nonexistent blob) or trust the build to 404 at runtime? Lean toward a manifest for the Hotrod audience.
- Update the README's Media section to show usage examples.

**Out of scope:** image transformation pipeline, CDN config, video transcoding controls. Treat Mux + Blob as black boxes.

## Phase 3 — Agent-facing docs (`CLAUDE.md`)

**Why third:** ergonomics multiplier for everyone using the starter via an agent, and only meaningful once Phase 1 and 2 are real.

**Scope:**
- Root-level `CLAUDE.md` covering: how content is structured, frontmatter schemas, where to put new posts/authors/pages, the kebab-case + strict-Zod rules, how to add media after Phase 2, and what *not* to do (don't drop binaries in `/public`, don't add fields without updating the schema).
- A short "When the build fails, here's how to read the error" section pointing at the custom Zod messages.

**Out of scope:** generic Astro docs (link to Astro instead). This is a Hotrod-specific orientation.

## Optional / nice-to-have (not on the path)

- **Typography backtick fix.** `@tailwindcss/typography` adds literal `` ` `` around inline `<code>` via `::before/::after`. Trivial CSS override in `global.css` if you want it gone.
- **Tailwind theme.** You said it's intentionally held back; slot it in via Tailwind v4's `@theme` block in `global.css` whenever ready — no component changes needed.
- **RSS feed, sitemap, tag pages, pagination, search.** All deferred per the spec's non-goals. The data is already in the schemas for whenever they're useful.

---

## Copyable kickoff prompt

Paste this at the start of a fresh session in `/Users/jono/dev/hotrod`:

> I'm continuing work on Hotrod (`/Users/jono/dev/hotrod`), Roboto Studio's agent-first Astro starter. The first content pass is shipped on `main` (Astro 6, MDX, Tailwind v4, three strict Zod content collections with routes). The next-up plan is in `docs/next-up.md`. Conventions live in memory and in `README.md`: kebab-case filenames everywhere, strict Zod schemas with human-readable error messages, `public/` is chrome only (content media goes to Vercel Blob / Mux).
>
> I want to start **Phase 1: Deploy to Vercel**. Walk me through the brainstorming questions before doing anything — I haven't decided on production domain, custom build settings, or env-var strategy yet. Once we've agreed on the approach, write a short spec, then a plan, then implement.
