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

- Renders as a **black** section with a responsive grid (2-col on mobile, 4-col on md+).
- Emits `<CheckerboardDivider />` at both top and bottom of its own markup (black-bg block).
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

- **Black** section; 4-up grid on lg+ (2-up on md, 1-up on mobile). Smaller cards than card-grid; yellow tiles with black text.
- Emits `<CheckerboardDivider />` at both top and bottom of its own markup (black-bg block).
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

- **Black** section; large yellow heading; buttons same shape as hero.
- Emits `<CheckerboardDivider />` at both top and bottom of its own markup (black-bg block).

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
- Below: a tagline line reading: **Hotrod is built by [Roboto Studio](https://robotostudio.com).** The link uses the `external` target convention (`target="_blank" rel="noopener"`).
- A checkerboard divider lands BELOW the footer too, matching v0. Owned by `base-layout.astro`.

## Icon strategy (closes ROB-1994)

- Install `astro-icon` and `@iconify-json/lucide`.
- Wire `astro-icon` in `astro.config.mjs` as an integration.
- Components reference icons by short name (e.g. `'phone'`); the rendering component prefixes `lucide:` internally so authors never have to type prefixes.
- Schema field is `z.string()` — any of the ~1500 Lucide icons are allowed. Hotrod is a starter; locking to a small set is too restrictive for the businesses that adopt it.
- Author error for unknown icon: caught at `astro-icon`'s build-time error. We accept that error voice as "good enough"; if it reads poorly in practice, file a follow-up to wrap the icon usage with a custom check.
- A recommended starter set will be documented in the agent-facing `CLAUDE.md` (ROB-1996) when it lands, not enforced in the schema.

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
src/components/page-sections.astro               # DELETE — no longer needed
src/components/site-nav.astro                    # NEW — nav links + Book Now button
src/components/site-footer.astro                 # NEW — replaces inline footer
src/components/highlight-title.astro             # NEW — title highlight parser used by hero (+ future blocks)
src/components/lucide.astro                      # NEW — thin wrapper around astro-icon
src/layouts/base-layout.astro                    # MODIFY — wire site-nav + site-footer, add footer-bottom divider
src/pages/[...slug].astro                        # MODIFY — drop PageSections wrapper; render blocks directly
src/content/pages/index.mdx                      # REWRITE — block-composed homepage
src/content/pages/services.mdx                   # NEW — stub
src/content/pages/pricing.mdx                    # NEW — stub
src/content/pages/contact.mdx                    # NEW — stub
```

### Divider responsibility (the precise layout contract)

Dividers belong to **the block** when the block has a black background. The rule:

- **Black-bg blocks emit `<CheckerboardDivider />` at both the top and bottom of their own markup.** The divider is part of the block's own visual contract.
- **Yellow-bg blocks emit no dividers.** The visual transition is supplied entirely by the neighbouring black-bg block's divider.
- **Chrome dividers stay in `base-layout.astro`:** the existing `<CheckerboardDivider />` between header strip and `<slot />` is unchanged; one new `<CheckerboardDivider />` lands below the footer, matching v0.
- **`<PageSections>` is removed.** Now that dividers live inside blocks and each block is a full-bleed `<section>`, there is no inter-block layout left to own. `[...slug].astro` renders blocks directly inside `<BaseLayout>`; the file `src/components/page-sections.astro` and the import in `[...slug].astro` are deleted. This is a deliberate walk-back of the ROB-1993 framing — that ticket reserved `<PageSections>` for future inter-block layout concerns; this sprint is confirming none of those concerns landed, so the wrapper has earned its way out.

On the homepage (alternating yellow / black / yellow / black / yellow / black / yellow):

| Boundary | Divider source |
| -------- | --------------- |
| header(black) → hero(yellow) | base-layout (existing) |
| hero(yellow) → figures(black) | figures block's TOP |
| figures(black) → card-grid(yellow) | figures block's BOTTOM |
| card-grid(yellow) → feature-strip(black) | feature-strip's TOP |
| feature-strip(black) → pricing(yellow) | feature-strip's BOTTOM |
| pricing(yellow) → cta-banner(black) | cta-banner's TOP |
| cta-banner(black) → footer(yellow) | cta-banner's BOTTOM |
| footer(yellow) → end of page | base-layout (new) |

8 dividers total, matching v0.

Caveat (acknowledged): two adjacent black-bg blocks would produce a doubled divider. The schema doesn't prevent this. Authors are expected to avoid it; if it shows up in practice we'll revisit with adjacency-aware logic. The same applies to the stub pages: hero(yellow) → cta-banner(black) → footer(yellow) means cta-banner's bottom divider plus base-layout's footer-bottom divider — exactly the boundaries we want.

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
