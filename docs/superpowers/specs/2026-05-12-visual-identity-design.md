# Phase 2: Visual identity + chrome — design spec

Date: 2026-05-12
Status: Approved, ready for implementation plan
Predecessor: `2026-05-12-vercel-deploy-design.md`
Source of design: private repo `jonoroboto/v0-taxi-landing-page` (Next.js 15 + shadcn/ui + Tailwind v4)

## Goal

Apply Hotrod's actual visual brand to the live site at `hotrod.robotostudio.com`. Pull the design tokens, fonts, and chrome from the source repo, translated from Next.js+React+shadcn to Astro 6 + Tailwind v4. Keep all current routes and content; reskin layouts only.

## Why Phase 2 exists

- The source repo (`v0-taxi-landing-page`) is literally branded `HOTROD` in its header — its design *is* Hotrod's visual identity.
- The site is currently unstyled (Tailwind base + `@tailwindcss/typography` defaults). Branding it makes the production deploy feel real.
- This phase is intentionally scoped *before* the pagebuilder work (Phase 3) so the block system in Phase 3 is designed against a real, live visual language.

## Phase ordering change

This phase reshuffles the roadmap in `docs/next-up.md`:

| Phase | Was | Becomes |
|---|---|---|
| 2 | Media support | **Visual identity + chrome (this spec)** |
| 3 | `CLAUDE.md` | **Pagebuilder blocks for `pages` collection** |
| 4 | — | Media support (Vercel Blob + Mux) |
| 5 | — | `CLAUDE.md` |

`docs/next-up.md` is updated as part of this phase's final task.

## Scope

In scope:

- Translate the source repo's Tailwind v4 token system into `src/styles/global.css` — trimmed to what is actually used.
- Wire Astro 6's experimental `fonts` integration with the `fontsource` provider for Geist and Geist Mono.
- New `src/components/checkerboard-divider.astro` — direct port of the source repo's `checkerboard-divider.tsx`.
- Reskin `src/layouts/base-layout.astro` with: black top strip (HOTROD wordmark + nav), checkerboard divider, yellow body, black footer.
- Light touch-ups on `src/layouts/page-layout.astro`, `src/layouts/post-layout.astro`, `src/layouts/author-layout.astro`, and `src/components/post-meta.astro` to inherit the new palette and typography cleanly.
- Restyle `@tailwindcss/typography` prose tokens against the new palette so blog post bodies read on yellow.
- Add a short README "Design" section (between "Media" and "Commands") covering the experimental fonts API and where the palette lives.
- Delete stale repo-root screenshots (`homepage.png`, `hotrod-home.png`).

Explicitly out of scope:

- Any change to `src/content/**` (pages, blog, authors).
- Any change to `src/content.config.ts` (schemas untouched).
- Any change to `src/pages/**` (routes untouched).
- Block components, `<DisplayHeading>`, `<Hero>`, `<FeatureGrid>`, pricing card, CTA blocks. All belong to Phase 3.
- Icons (Lucide). The chrome has no icons; Phase 3 introduces icon strategy alongside blocks.
- Vercel Analytics. PostHog is planned for a later phase.
- Dark mode. The source design is light-only; bringing dark-mode tokens over would be dead code.
- shadcn `chart-*` and `sidebar-*` tokens. Unused in the source's visible design.
- Image optimization beyond what `imageService: true` (set in Phase 1) already enables.
- Performance / Lighthouse / Core Web Vitals gating. Verify only that no obvious regression lands.
- Cross-browser visual review beyond what Playwright MCP covers in Chromium.

## Decisions and reasoning

| Decision | Choice | Why |
|---|---|---|
| Depth of design lift | Visual identity only (palette, fonts, chrome, prose styling) | Hotrod's pitch is "an agent can grok the surface in one read." Pulling the full shadcn/Radix React layer doubles that surface. |
| Component framework | Astro-only, no React | `@astrojs/react` would add a new component language. The chrome doesn't need it; Phase 3 blocks won't either. |
| Routes | Keep all current routes | The route structure *is* the demonstration value of Hotrod as a starter. |
| Token system shape | shadcn-style CSS custom properties mapped via Tailwind v4 `@theme inline`, **trimmed** | Matches the source. Trimming (no dark, no chart, no sidebar) keeps the file scannable. |
| Fonts | Astro 6 experimental `fonts` integration with `fontsource` provider | Cleaner than `@fontsource` direct npm imports; documented experimental-API risk surfaced in README. |
| Icons | Defer to Phase 3 | The chrome has no icons. Decision belongs with block-component design. |
| Vercel Analytics | Skip | PostHog will land in its own phase later. |
| Page content rewrites | None | The bold display treatment is a Phase 3 (pagebuilder) thing. Phase 2 keeps a clean diff. |
| Stale screenshots | Delete `homepage.png`, `hotrod-home.png` from repo root | Show pre-design state; misleading once new design ships. New screenshots, if wanted, can be added later. |
| Pagebuilder | Out of scope, Phase 3 | Design lock-ins are easier once you can see the design rendered. |

## Architecture

Two surfaces change. Everything else stays the same.

### 1. Theme layer — `src/styles/global.css`

Becomes the home of Hotrod's design tokens. Structure:

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

:root {
  /* Palette */
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

  /* Restyle prose for yellow background. Black headings, slightly muted body. */
  .prose {
    --tw-prose-body: var(--foreground);
    --tw-prose-headings: var(--foreground);
    --tw-prose-links: var(--foreground);
    --tw-prose-bold: var(--foreground);
    --tw-prose-code: var(--foreground);
    --tw-prose-quotes: var(--foreground);
  }
}
```

The `--font-sans` / `--font-mono` variables on the right of the `@theme inline` block are populated by the Astro fonts integration (via the `cssVariable` option). The variables on the left (`--color-*`) are the names Tailwind v4 generates utilities for (e.g. `bg-background`, `text-foreground`, `border-border`).

### 2. Layout chrome — `src/layouts/base-layout.astro`

Replaces the current minimal `base-layout` with this structure (pseudocode):

```
<html>
  <head>
    <!-- meta, title, fonts preload from Astro fonts integration -->
  </head>
  <body>
    <header class="bg-primary text-primary-foreground">
      <div class="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <a href="/" class="text-2xl font-black tracking-tight">HOTROD</a>
        <nav class="flex items-center gap-8 font-bold">
          <a href="/blog">Blog</a>
          <a href="/authors">Authors</a>
        </nav>
      </div>
    </header>

    <CheckerboardDivider />

    <main class="min-h-screen bg-background">
      <slot />
    </main>

    <footer class="bg-primary text-primary-foreground text-center py-6">
      Built with Hotrod.
    </footer>
  </body>
</html>
```

The four layout files all keep their current responsibility:

- `base-layout.astro` — overall page chrome (above).
- `page-layout.astro` — wraps page content in a prose container.
- `post-layout.astro` — wraps blog post content with the `<PostMeta>` byline at the top.
- `author-layout.astro` — wraps author profile content with social links.

Each non-base layout will pass its slot into `base-layout` and apply a `max-w-3xl mx-auto px-6 py-12` container around its prose. No new abstractions; just consistent inner-container styling.

### 3. New component — `src/components/checkerboard-divider.astro`

Direct port of `components/checkerboard-divider.tsx` from the source repo.

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

Uses the CSS custom properties so the divider stays in sync if the palette ever shifts.

### 4. `astro.config.mjs` — experimental fonts integration

Adds the experimental fonts block alongside the existing adapter and integrations:

```js
// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  adapter: vercel({ imageService: true }),
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
  experimental: {
    fonts: [
      {
        provider: fontProviders.fontsource(),
        name: 'Geist',
        cssVariable: '--font-sans',
      },
      {
        provider: fontProviders.fontsource(),
        name: 'Geist Mono',
        cssVariable: '--font-mono',
      },
    ],
  },
});
```

The exact import path (`fontProviders` from `astro/config`) and shape are confirmed during implementation against the Astro 6.3.x docs; if the API differs, the implementation plan stops and reports back rather than guessing.

`base-layout.astro` consumes the integration via `<Font />` from `astro:assets` (or whichever API the integration exposes — confirmed in the plan), in the `<head>` to wire preload tags.

## File changes

Modified:

- `package.json` — depending on what Astro's `fontsource` provider needs, may add no new direct deps (provider may pull what it needs) or `@fontsource-variable/geist` + `@fontsource-variable/geist-mono`. Decided during implementation.
- `pnpm-lock.yaml` — regenerated by `pnpm install`.
- `astro.config.mjs` — add `experimental.fonts` block + `fontProviders` import.
- `src/styles/global.css` — replace current contents with the token system described above.
- `src/layouts/base-layout.astro` — new chrome (header strip, checkerboard divider, main slot, footer).
- `src/layouts/page-layout.astro`, `src/layouts/post-layout.astro`, `src/layouts/author-layout.astro` — apply the inner `max-w-3xl mx-auto px-6 py-12` container so prose lives on yellow without touching the edges.
- `src/components/post-meta.astro` — minor typography tweak so the date + byline read on yellow.
- `README.md` — add a new "Design" section (between "Media" and "Commands") covering: palette and tokens live in `src/styles/global.css`; fonts use Astro 6 experimental fonts API (flagged experimental); checkerboard divider is brand chrome.

New:

- `src/components/checkerboard-divider.astro` — described above.

Removed:

- `homepage.png` and `hotrod-home.png` at the repo root.

Not touched:

- `src/content/**`
- `src/content.config.ts`
- `src/pages/**`
- `public/**`
- `.gitignore`, `.env.example`
- Phase 1 spec/plan documents

## Verification

Three gates, in order. Stop and fix on any failure before claiming Phase 2 done.

### Gate 1 — Local build passes

- `pnpm install` adds any new deps cleanly.
- `pnpm astro check` reports 0 errors. Warnings from Astro about the experimental fonts feature are acceptable; type errors are not.
- `pnpm build` completes, emits the same 7 routes as Phase 1, log shows Vercel adapter + Geist + Geist Mono loaded.

### Gate 2 — Local visual smoke check

`pnpm dev`, open `http://localhost:4321/`:

- Yellow page background, black header strip with HOTROD wordmark on the left, "Blog" + "Authors" nav on the right.
- Checkerboard divider directly under the header (visible black/yellow diagonal pattern, ~56px tall by default).
- Body text in Geist; no flash of unstyled fonts on a hard reload.
- Footer: black strip, yellow "Built with Hotrod." centered.
- Repeat for `/blog`, `/blog/welcome-to-hotrod`, `/authors`, `/authors/jono`, `/about`, `/services/astro` — same chrome on each.
- Blog post body reads legibly on yellow (prose color overrides took effect).

### Gate 3 — Production smoke check

Push to `main`, wait for Vercel auto-deploy:

- `pnpm dlx vercel ls hotrod --scope roboto-pro` confirms latest deploy is `Ready`.
- Playwright MCP loads `https://hotrod.robotostudio.com/`, `/blog/welcome-to-hotrod`, `/authors/jono`. For each: 200, no console errors. Accessibility snapshot contains the HOTROD wordmark, the navigation links, the page content, and the footer text.
- DOM check via Playwright: header element present, footer element present, no broken layout.

What is NOT being verified in Phase 2:

- Block schemas (Phase 3).
- Media support (Phase 4).
- Performance / Core Web Vitals.
- Cross-browser visual review (defer unless a regression shows up).

## Risks

- **Experimental fonts API may shift.** Mitigation: pin Astro to the current major (already `^6.3.1`); document the experimental status in README; if the API changes in a future Astro minor, the upgrade path lands in its own task.
- **`@tailwindcss/typography` prose overrides may not cover every selector.** Mitigation: smoke check renders a real blog post body; if anything looks off, extend the prose overrides in `global.css`.
- **Geist via fontsource may not include the `font-black` (900) weight.** Mitigation: implementation plan checks the available weights before wiring; falls back to `font-bold` (700) in the wordmark + headings if 900 isn't available. The visual treatment still works at 700.

## Success criteria

Phase 2 is done when:

- All three verification gates pass.
- `hotrod.robotostudio.com` shows the new design.
- `docs/next-up.md` reflects the new phase ordering with Phase 2 marked complete.
- No regression in route count, route content, or schema validation.
