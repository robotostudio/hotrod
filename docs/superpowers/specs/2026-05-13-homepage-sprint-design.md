# Homepage sprint — design

**Linear (closes):** ROB-1982 (nav chrome), ROB-1983 (hero), ROB-1984 (figures), ROB-1985 (card-grid), ROB-1986 (feature-strip), ROB-1987 (pricing), ROB-1988 (cta-banner), ROB-1989 (footer chrome), ROB-1994 (icon strategy), ROB-1995 (homepage migration).
**Date:** 2026-05-13
**Status:** Draft, pending user review

## Goal

Ship a 1:1 recreation of the v0 taxi landing page (`jonoroboto/v0-taxi-landing-page` → `app/page.tsx`) as Hotrod's homepage, using the block framework landed in ROB-1993. Six real block components replace their stubs; nav and footer chrome carry their new content; an icon strategy lands; three stub destination pages keep nav links functional.

## Reference

Source: `app/page.tsx` in `jonoroboto/v0-taxi-landing-page` (Next.js + Tailwind + lucide-react). Live preview was at `https://vm-7mjg6bult8smxygl9xlq5srw.vusercontent.net/` (auth-walled at fetch time; source code is the authoritative reference).

## Section → block mapping

| v0 section            | Hotrod block (or chrome) | Background    |
| --------------------- | ------------------------ | ------------- |
| Top nav strip         | chrome (base-layout)     | black on yellow |
| "FAST. SAFE. …"       | `hero`                   | yellow        |
| Stats row             | `figures`                | black         |
| "OUR SERVICES"        | `card-grid`              | yellow        |
| "WHY CHOOSE US"       | `feature-strip`          | black         |
| "SIMPLE PRICING"      | `pricing`                | yellow        |
| "READY TO RIDE?"      | `cta-banner`             | black         |
| Footer                | chrome (base-layout)     | yellow        |

Checkerboard dividers sit between sections — they are NOT block-internal. They are emitted by `<PageSections>` between adjacent blocks (and at the top + bottom of the block run, to match v0's flanking dividers).

## Block schemas

All schemas are `.strict()` with human-readable Zod messages aimed at non-technical authors. All blocks ship at `src/blocks/<name>/{schema.ts, index.astro}` replacing the existing stubs.

### Common types

```ts
// src/blocks/_shared/button-schema.ts
export const buttonSchema = z.object({
  label: requiredString('label'),
  href: requiredString('href'),
  variant: z.enum(['filled', 'outlined']).default('filled'),
  icon: z.string().optional(), // lucide icon name, e.g. 'phone' or 'map-pin'
}).strict();
```

Icon names are bare lucide slugs (e.g. `'phone'`, `'map-pin'`, `'car'`); the component prefixes `lucide:` for `astro-icon`.

### hero

```ts
{
  type: 'hero',
  title: string,           // may contain ==highlight== markers
  text: string,
  buttons: ButtonSpec[],   // 1+ (max 3)
}
```

- `title` highlight syntax: `==text==` renders as a block-level inline-block "pill" — black bg + yellow text on a yellow section; reverses on dark sections (but hero is yellow only). The highlight drops to its own visual line because it's `inline-block` with a line break before it; v0 used an explicit `<br>` to achieve the same. We achieve it via CSS: the `<mark>` is `inline-block` and the preceding `<br>` is inserted at render time (the parser splits on `==` and emits `<br>` before each highlight span).
- Buttons render side by side, baseline aligned, equal heights — fixes the v0 alignment bug noted in ROB-1983.
- Section bg yellow; black bold black title; yellow `==pill==` on black bg.

### figures

```ts
{
  type: 'figures',
  items: { value: string, label: string }[],   // 2..6 items
}
```

- Renders as a black section with a responsive grid (2-col on mobile, 4-col on md+).
- `value` is a free-form string so authors can write `"500K+"`, `"4.9★"`, `"24/7"` literally.
- No section heading in v0; field omitted from schema. (Future: add optional `title` if ever wanted.)

### card-grid

```ts
{
  type: 'card-grid',
  title: requiredString,
  items: {
    icon: string,            // lucide name
    title: requiredString,
    description: requiredString,
  }[],                       // 3..4 items
}
```

- Yellow section; 3-up grid on md+; cards are black with yellow text.
- Title is centered, large, black.

### feature-strip

```ts
{
  type: 'feature-strip',
  title: requiredString,
  items: {
    icon: string,
    title: requiredString,
    description: requiredString,
  }[],                       // 3..6 items
}
```

- Black section; 4-up grid on lg+ (2-up on md, 1-up on mobile). Smaller cards than card-grid; yellow tiles with black text.
- Items are visually denser than card-grid items — same prop shape, different layout.

### pricing

```ts
{
  type: 'pricing',
  title: requiredString,
  plans: {
    name: requiredString,
    price: requiredString,           // free-form, e.g. "$2.50"
    unit: requiredString,            // e.g. "/mile"
    features: string[],              // 1+ items
    featured: boolean,               // default false
    cta: { label: string, href: string },
  }[],                               // exactly 3 plans for the homepage; schema allows 2..4
}
```

- Yellow section; 3-up grid; one plan may set `featured: true` to render with inverted (black) background and `scale-105`.
- Each feature renders with a leading Lucide `star` icon.
- The plan card's CTA is a full-width button at the bottom of the card.

### cta-banner

```ts
{
  type: 'cta-banner',
  title: requiredString,
  text: requiredString,
  buttons: ButtonSpec[],             // 1..2 items
}
```

- Black section; large yellow heading; buttons same shape as hero.

## Chrome updates

### Nav (extends `src/layouts/base-layout.astro`)

The current header strip has only the HOTROD wordmark. Add:

- A nav element with four links: `/services`, `/pricing`, `/about`, `/contact`. Labels: "Services", "Pricing", "About", "Contact".
- A "Book Now" button on the right, linking to `/contact`, styled yellow-on-black-inverted.

Hidden on mobile (`md:` breakpoint), matching v0. No mobile menu yet — out of scope; flag as a follow-up if mobile becomes load-bearing.

Nav data is hardcoded in `base-layout.astro`. Future: extract to a config file when blog/marketing surfaces add their own nav requirements. Not yet.

### Footer (replaces current footer in `src/layouts/base-layout.astro`)

Add:

- Footer is yellow (matching v0).
- HOTROD wordmark on left.
- Right cluster: "Privacy", "Terms", "Support" links (hrefs: `/legal/privacy`, `/legal/terms`, `/support` — these can 404 for now; not in sprint scope to wire them up).
- Below: copyright line "© <year> Roboto Studio. All rights reserved.", with `<year>` rendered at build time.
- A checkerboard divider lands BELOW the footer too, matching v0.

## Icon strategy (closes ROB-1994)

- Install `astro-icon` and `@iconify-json/lucide`.
- Wire `astro-icon` in `astro.config.mjs` as an integration.
- Components reference icons by short name (e.g. `'phone'`); the rendering component prefixes `lucide:` internally so authors never have to type prefixes.
- Allowed icon names for this sprint (locked at schema level via `z.enum(...)` if practical, otherwise `z.string()` with build-time existence check is deferred):
  - `phone`, `map-pin`, `car`, `clock`, `shield`, `star`, `users`, `zap`
- Author error for unknown icon: caught at `astro-icon`'s build-time. We accept that error voice as "good enough"; if it's poor, file a follow-up to wrap the icon usage with a custom Zod check.

## Highlight syntax (formalises ROB-1983)

Implemented inside the hero block initially. If figures/feature-strip start needing highlight, extract to `src/lib/highlight.astro` later.

- Parser splits the title string on `==` boundaries.
- Even-index segments render plain; odd-index segments render inside a `<mark>` element with a leading `<br>` (so the highlight drops to its own visual line).
- The `<mark>` is styled as `inline-block` with black background, yellow text, padding, no border. (Reverses on dark sections, but hero is yellow-only.)
- Authors who don't want a forced line break can split into two strings later — out of scope for sprint.

## Stub destination pages

Three new content entries to keep nav links functional:

- `src/content/pages/services.mdx` — hero ("Services — coming soon" + brief text) + cta-banner ("Back to home" or "Get in touch" linking to `/contact`).
- `src/content/pages/pricing.mdx` — hero ("Pricing — coming soon") + cta-banner. (The homepage already has the real pricing block; these stubs just satisfy the nav target.)
- `src/content/pages/contact.mdx` — hero ("Get in touch") + cta-banner.

All three use the same two-block shape so authors learn the pattern by example.

## Homepage migration

`src/content/pages/index.mdx` becomes the block-composed homepage. Its frontmatter carries:

- `title: "Hotrod — Fast. Safe. Reliable."`
- `description: "..."` (60-160 chars; reuse the v0 hero text)
- `publishedAt: 2026-05-13` (keep existing)
- `updatedAt: 2026-05-13`
- `blocks: [hero, figures, card-grid, feature-strip, pricing, cta-banner]` with the v0's exact copy.

The MDX body becomes empty.

## File layout

New / changed files:

```
astro.config.mjs                                 # add astro-icon integration
package.json + pnpm-lock.yaml                    # add astro-icon, @iconify-json/lucide
src/blocks/_shared/button-schema.ts              # NEW — shared button Zod
src/blocks/_shared/icon-name.ts                  # NEW — lucide icon enum + helper
src/blocks/hero/{schema.ts, index.astro}         # REWRITE stubs
src/blocks/figures/{schema.ts, index.astro}      # REWRITE stubs
src/blocks/card-grid/{schema.ts, index.astro}    # REWRITE stubs
src/blocks/feature-strip/{schema.ts, index.astro}# REWRITE stubs
src/blocks/pricing/{schema.ts, index.astro}      # REWRITE stubs
src/blocks/cta-banner/{schema.ts, index.astro}   # REWRITE stubs
src/components/page-sections.astro               # MODIFY — emit dividers between blocks
src/components/site-nav.astro                    # NEW — nav links + Book Now button
src/components/site-footer.astro                 # NEW — replaces inline footer
src/components/highlight-title.astro             # NEW — title highlight parser used by hero (+ future blocks)
src/components/lucide.astro                      # NEW — thin wrapper around astro-icon with name validation
src/layouts/base-layout.astro                    # MODIFY — wire site-nav + site-footer
src/content/pages/index.mdx                      # REWRITE — block-composed homepage
src/content/pages/services.mdx                   # NEW — stub
src/content/pages/pricing.mdx                    # NEW — stub
src/content/pages/contact.mdx                    # NEW — stub
```

### Divider responsibility (the precise layout contract)

Counting dividers in the v0 reference: 8 total — one above the hero (after nav), one between every adjacent section (5), one above the footer, one below the footer. Hotrod splits responsibility:

- **`base-layout.astro`** emits dividers FLANKING the `<slot />` (above and below) and one final divider below the footer. So: `header → divider → <slot /> → divider → footer → divider`.
- **`<PageSections>`** emits dividers BETWEEN adjacent block children only. It does NOT emit a top or bottom divider — those are BaseLayout's job and would double up.
- For the homepage (6 blocks): 1 (header bottom, base) + 5 (between blocks, PageSections) + 1 (slot bottom, base) + 1 (footer bottom, base) = **8 dividers**, matching v0.
- For body-only pages: 1 + 0 + 1 + 1 = 3 dividers (top, before footer, after footer). The same chrome rhythm.

`<PageSections>` divider behavior is fixed (no schema flag). If a future block wants to suppress, we'll add a per-block boolean then. The departure from ROB-1993's "thin wrapper" framing is deliberate — pushing dividers into each block would duplicate the import 6× and breach the "PageSections owns inter-block layout" rule.

## Verification

- `pnpm astro check` — 0 errors.
- `pnpm build` — PASS. Routes generated: `/`, `/about`, `/services`, `/pricing`, `/contact`, `/services/astro`, `/blog`, `/blog/welcome-to-hotrod`, `/authors`, `/authors/jono`. (10 routes — adds `/services`, `/pricing`, `/contact`.)
- Manual: open the dev server and confirm `/` matches the v0 reference section-by-section (palette, icon presence, button shapes, divider placement, highlight pill, featured pricing tier).
- Manual negative: bad icon name in a block fails the build with an actionable error (acceptable if `astro-icon`'s default is readable; otherwise file follow-up).

## Out of scope

- Mobile nav menu (hamburger).
- Real `/legal/privacy`, `/legal/terms`, `/support` pages.
- Real services / pricing / contact content (stubs only).
- CMS integration; admin UI.
- Search, sitemap, RSS.
- Image blocks; Mux video; agent docs.
- A test framework — verification stays `astro check` + `build` + manual.

## Open follow-ups

- If `astro-icon`'s "unknown icon" error reads poorly, wrap each block's icon field with a custom Zod check against the locked icon enum.
- If the inline-block highlight breaks on long titles (e.g. mid-word), accept that authors will hand-tune titles. No more parser work in this sprint.
- After the sprint ships, retitle/rescope ROB-1982 and ROB-1989 in Linear to reflect "chrome" rather than "block". Mark all the listed Linear tickets Done as their pieces land in commits.
