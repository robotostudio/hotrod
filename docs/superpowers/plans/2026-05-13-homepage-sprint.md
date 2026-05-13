# Homepage sprint implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the v0 taxi landing page 1:1 as Hotrod's homepage, using the pagebuilder framework landed in ROB-1993. Replace all six block stubs with real components, ship nav + footer chrome, install the icon library, migrate the homepage, and add three stub destination pages so the nav links work.

**Architecture:** Each block is a self-contained full-bleed `<section>` rendered directly inside `<BaseLayout>`. Black-bg blocks emit their own checkerboard dividers (top + bottom); yellow-bg blocks emit none. `<PageSections>` is deleted. `src/pages/[...slug].astro` is simplified accordingly. Icons via `astro-icon` + `@iconify-json/lucide`, accessed through a small `Lucide` wrapper. The hero block's title supports inline `==highlight==` syntax via a `<HighlightTitle>` component. A shared button schema (`_shared/button-schema.ts`) is reused by hero and cta-banner.

**Tech Stack:** Astro 6 + MDX + Tailwind v4. Strict Zod. No test framework — verification is `pnpm astro check` + `pnpm build` + manual browser check.

**Linear (closed by this sprint):** ROB-1982, ROB-1983, ROB-1984, ROB-1985, ROB-1986, ROB-1987, ROB-1988, ROB-1989, ROB-1994, ROB-1995.
**Spec:** `docs/superpowers/specs/2026-05-13-homepage-sprint-design.md`.

## Token reference (already in `src/styles/global.css`)

- `--background` = yellow `#FFD700` → class `bg-background`, `text-background`
- `--foreground` = black `#000000` → class `bg-foreground`, `text-foreground`
- `--primary` = black, `--primary-foreground` = yellow → class `bg-primary text-primary-foreground` (existing header strip)
- `--secondary` = `#FFC107` (mustard) → class `bg-secondary` (used for pricing's non-featured cards in v0)
- `--accent` = `#FFEB3B` → class `bg-accent`

Block bg conventions:
- Yellow sections → `bg-background text-foreground`
- Black sections → `bg-foreground text-background` (or equivalently `bg-primary text-primary-foreground`)

Stick to these tokens everywhere; no inline hex codes.

---

## File map

**New files:**
- `src/blocks/_shared/button-schema.ts`
- `src/components/lucide.astro`
- `src/components/highlight-title.astro`
- `src/components/site-nav.astro`
- `src/components/site-footer.astro`
- `src/content/pages/services.mdx`
- `src/content/pages/pricing.mdx`
- `src/content/pages/contact.mdx`

**Rewritten files (each block):**
- `src/blocks/hero/{schema.ts, index.astro}`
- `src/blocks/figures/{schema.ts, index.astro}`
- `src/blocks/card-grid/{schema.ts, index.astro}`
- `src/blocks/feature-strip/{schema.ts, index.astro}`
- `src/blocks/pricing/{schema.ts, index.astro}`
- `src/blocks/cta-banner/{schema.ts, index.astro}`

**Modified files:**
- `astro.config.mjs` — register `astro-icon` integration
- `package.json` / `pnpm-lock.yaml` — add `astro-icon`, `@iconify-json/lucide`
- `src/layouts/base-layout.astro` — swap inline nav/footer for components; add footer-bottom divider
- `src/pages/[...slug].astro` — drop `<PageSections>` import + wrapper; render blocks directly
- `src/content/pages/index.mdx` — replace body with block-composed frontmatter

**Deleted files:**
- `src/components/page-sections.astro`

---

## Task 1: Install astro-icon + Lucide and register the integration

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`
- Modify: `astro.config.mjs`

- [ ] **Step 1: Install dependencies**

```bash
pnpm add astro-icon
pnpm add -D @iconify-json/lucide
```

- [ ] **Step 2: Wire integration in `astro.config.mjs`**

Read the file first. The current file imports `mdx`, the Vercel adapter, and uses Astro 6 fonts API. Add `astro-icon` to the integrations array.

Add the import (with the other integration imports):

```ts
import icon from 'astro-icon';
```

And add `icon()` to the `integrations: [...]` array (no options needed; the lucide set is auto-discovered from the dev dependency).

- [ ] **Step 3: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 4: Run `pnpm build`**

Run: `pnpm build`
Expected: PASS, 7 routes (same as today — no new content yet).

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
Install astro-icon + Lucide icon set (ROB-1994)

Adds astro-icon and @iconify-json/lucide so blocks can reference Lucide
icons by name (e.g. 'phone'). Build-time SVG inlining; no client JS.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create the `Lucide` icon wrapper

**Files:**
- Create: `src/components/lucide.astro`

A thin wrapper around `astro-icon`'s `<Icon>` that prefixes `lucide:` so block authors and components write bare names like `'phone'`.

- [ ] **Step 1: Create `src/components/lucide.astro`**

```astro
---
import { Icon } from 'astro-icon/components';

type Props = {
  name: string;
  class?: string;
};

const { name, class: className } = Astro.props;
---
<Icon name={`lucide:${name}`} class={className} />
```

- [ ] **Step 2: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/lucide.astro
git commit -m "$(cat <<'EOF'
Add <Lucide> icon wrapper

Thin wrapper around astro-icon's <Icon> that prefixes 'lucide:' so
authors and block components reference icons by bare name.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create the shared button schema

**Files:**
- Create: `src/blocks/_shared/button-schema.ts`

Shared between hero and cta-banner.

- [ ] **Step 1: Create `src/blocks/_shared/button-schema.ts`**

```ts
import { z } from 'astro:content';

export const buttonSchema = z
  .object({
    label: z
      .string({ message: '`buttons[].label` is required.' })
      .min(1, { message: '`buttons[].label` must not be empty.' }),
    href: z
      .string({ message: '`buttons[].href` is required.' })
      .min(1, { message: '`buttons[].href` must not be empty.' }),
    variant: z.enum(['filled', 'outlined']).default('filled'),
    icon: z.string().optional(),
  })
  .strict();
```

- [ ] **Step 2: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/blocks/_shared/button-schema.ts
git commit -m "$(cat <<'EOF'
Add shared button schema for hero/cta-banner

Universal button spec: label, href, variant ('filled' | 'outlined',
default 'filled'), optional Lucide icon name.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create the `HighlightTitle` parser component

**Files:**
- Create: `src/components/highlight-title.astro`

Splits a string on `==…==` markers. Even-index segments render plain; odd-index segments render as a block-level `<mark>` with a leading `<br>` so the highlight drops to its own line.

- [ ] **Step 1: Create `src/components/highlight-title.astro`**

```astro
---
type Props = {
  text: string;
};

const { text } = Astro.props;

const segments = text.split('==');
// even-index segments are plain text; odd-index segments are highlights.
---
{segments.map((segment, i) =>
  i % 2 === 0
    ? <Fragment set:text={segment} />
    : (
      <>
        <br />
        <mark class="inline-block bg-foreground text-background px-4 py-2 mt-2">
          {segment}
        </mark>
      </>
    )
)}
```

The `<mark>` styling mirrors v0's `<span className="bg-black text-[#FFD700] px-4 py-2 inline-block mt-2">`. `bg-foreground text-background` resolves to black-on-yellow in this token system.

- [ ] **Step 2: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/highlight-title.astro
git commit -m "$(cat <<'EOF'
Add <HighlightTitle> for ==text== inline highlight syntax

Parses ==…== markers and renders each highlight as a block-level
inline-block <mark> on its own line. Used initially by hero block.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Implement the `hero` block

**Files:**
- Rewrite: `src/blocks/hero/schema.ts`
- Rewrite: `src/blocks/hero/index.astro`

Yellow full-bleed section. Title with optional `==highlight==`, body text, 1–3 buttons baseline-aligned.

- [ ] **Step 1: Rewrite `src/blocks/hero/schema.ts`**

```ts
import { z } from 'astro:content';
import { buttonSchema } from '../_shared/button-schema';

export const heroSchema = z
  .object({
    type: z.literal('hero'),
    title: z
      .string({ message: '`hero.title` is required.' })
      .min(1, { message: '`hero.title` must not be empty.' }),
    text: z
      .string({ message: '`hero.text` is required.' })
      .min(1, { message: '`hero.text` must not be empty.' }),
    buttons: z
      .array(buttonSchema)
      .min(1, { message: '`hero.buttons` must contain at least one button.' })
      .max(3, { message: '`hero.buttons` can contain at most three buttons.' }),
  })
  .strict();
```

- [ ] **Step 2: Rewrite `src/blocks/hero/index.astro`**

```astro
---
import HighlightTitle from '../../components/highlight-title.astro';
import Lucide from '../../components/lucide.astro';

type Props = {
  type: 'hero';
  title: string;
  text: string;
  buttons: {
    label: string;
    href: string;
    variant: 'filled' | 'outlined';
    icon?: string;
  }[];
};

const { title, text, buttons } = Astro.props;
---
<section class="bg-background text-foreground py-20 px-6">
  <div class="mx-auto max-w-7xl text-center">
    <h1 class="text-6xl md:text-8xl font-black mb-6 tracking-tight">
      <HighlightTitle text={title} />
    </h1>
    <p class="text-xl md:text-2xl font-semibold max-w-2xl mx-auto mb-10">
      {text}
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
      {buttons.map((button) => (
        <a
          href={button.href}
          class:list={[
            'inline-flex items-center justify-center font-bold text-lg px-8 py-6 transition-colors',
            button.variant === 'filled'
              ? 'bg-foreground text-background hover:bg-foreground/90'
              : 'border-4 border-foreground text-foreground hover:bg-foreground hover:text-background',
          ]}
        >
          {button.icon && <Lucide name={button.icon} class="mr-2 w-5 h-5" />}
          {button.label}
        </a>
      ))}
    </div>
  </div>
</section>
```

Buttons render as anchors (not `<button>`) because they navigate; `inline-flex` + `items-stretch` on the container keeps them equal height (fixes the v0 alignment bug noted in ROB-1983).

- [ ] **Step 3: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/blocks/hero
git commit -m "$(cat <<'EOF'
Implement hero block (ROB-1983)

Yellow full-bleed section. Title supports inline ==highlight== via
<HighlightTitle>. Buttons (1–3) baseline-aligned, equal height, with
optional Lucide icon prefix.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Implement the `figures` block

**Files:**
- Rewrite: `src/blocks/figures/schema.ts`
- Rewrite: `src/blocks/figures/index.astro`

Black full-bleed section. Stats grid (2–6 items). Emits dividers top + bottom.

- [ ] **Step 1: Rewrite `src/blocks/figures/schema.ts`**

```ts
import { z } from 'astro:content';

export const figuresSchema = z
  .object({
    type: z.literal('figures'),
    items: z
      .array(
        z
          .object({
            value: z
              .string({ message: '`figures.items[].value` is required.' })
              .min(1, { message: '`figures.items[].value` must not be empty.' }),
            label: z
              .string({ message: '`figures.items[].label` is required.' })
              .min(1, { message: '`figures.items[].label` must not be empty.' }),
          })
          .strict(),
      )
      .min(2, { message: '`figures.items` must contain at least two items.' })
      .max(6, { message: '`figures.items` can contain at most six items.' }),
  })
  .strict();
```

- [ ] **Step 2: Rewrite `src/blocks/figures/index.astro`**

```astro
---
import CheckerboardDivider from '../../components/checkerboard-divider.astro';

type Props = {
  type: 'figures';
  items: { value: string; label: string }[];
};

const { items } = Astro.props;
---
<CheckerboardDivider />
<section class="bg-foreground text-background py-16 px-6">
  <div class="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    {items.map((item) => (
      <div>
        <div class="text-4xl md:text-5xl font-black">{item.value}</div>
        <div class="text-lg font-semibold mt-2">{item.label}</div>
      </div>
    ))}
  </div>
</section>
<CheckerboardDivider />
```

- [ ] **Step 3: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/blocks/figures
git commit -m "$(cat <<'EOF'
Implement figures block (ROB-1984)

Black full-bleed stats section. 2–6 items rendered as a responsive
2-up/4-up grid. Emits checkerboard dividers at top and bottom of its
own markup.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Implement the `card-grid` block

**Files:**
- Rewrite: `src/blocks/card-grid/schema.ts`
- Rewrite: `src/blocks/card-grid/index.astro`

Yellow full-bleed section. Centered title, 3-up grid of icon cards (black bg). No dividers.

- [ ] **Step 1: Rewrite `src/blocks/card-grid/schema.ts`**

```ts
import { z } from 'astro:content';

export const cardGridSchema = z
  .object({
    type: z.literal('card-grid'),
    title: z
      .string({ message: '`card-grid.title` is required.' })
      .min(1, { message: '`card-grid.title` must not be empty.' }),
    items: z
      .array(
        z
          .object({
            icon: z
              .string({ message: '`card-grid.items[].icon` is required.' })
              .min(1, { message: '`card-grid.items[].icon` must not be empty.' }),
            title: z
              .string({ message: '`card-grid.items[].title` is required.' })
              .min(1, { message: '`card-grid.items[].title` must not be empty.' }),
            description: z
              .string({ message: '`card-grid.items[].description` is required.' })
              .min(1, { message: '`card-grid.items[].description` must not be empty.' }),
          })
          .strict(),
      )
      .min(2, { message: '`card-grid.items` must contain at least two items.' })
      .max(4, { message: '`card-grid.items` can contain at most four items.' }),
  })
  .strict();
```

- [ ] **Step 2: Rewrite `src/blocks/card-grid/index.astro`**

```astro
---
import Lucide from '../../components/lucide.astro';

type Props = {
  type: 'card-grid';
  title: string;
  items: { icon: string; title: string; description: string }[];
};

const { title, items } = Astro.props;
---
<section class="bg-background text-foreground py-20 px-6">
  <div class="mx-auto max-w-7xl">
    <h2 class="text-5xl md:text-6xl font-black text-center mb-16">{title}</h2>
    <div class="grid md:grid-cols-3 gap-8">
      {items.map((item) => (
        <article class="bg-foreground text-background p-8 border-4 border-foreground hover:border-background transition-colors">
          <Lucide name={item.icon} class="w-16 h-16 mb-6" />
          <h3 class="text-2xl font-black mb-4">{item.title}</h3>
          <p class="text-lg font-medium opacity-90">{item.description}</p>
        </article>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 3: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/blocks/card-grid
git commit -m "$(cat <<'EOF'
Implement card-grid block (ROB-1985)

Yellow full-bleed section. Centered title plus a 3-up grid of icon
cards (black bg, yellow text). No dividers — owned by neighbouring
black-bg blocks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Implement the `feature-strip` block

**Files:**
- Rewrite: `src/blocks/feature-strip/schema.ts`
- Rewrite: `src/blocks/feature-strip/index.astro`

Black full-bleed section. Yellow heading, 4-up grid of yellow tiles with black text. Emits dividers top + bottom.

- [ ] **Step 1: Rewrite `src/blocks/feature-strip/schema.ts`**

```ts
import { z } from 'astro:content';

export const featureStripSchema = z
  .object({
    type: z.literal('feature-strip'),
    title: z
      .string({ message: '`feature-strip.title` is required.' })
      .min(1, { message: '`feature-strip.title` must not be empty.' }),
    items: z
      .array(
        z
          .object({
            icon: z
              .string({ message: '`feature-strip.items[].icon` is required.' })
              .min(1, { message: '`feature-strip.items[].icon` must not be empty.' }),
            title: z
              .string({ message: '`feature-strip.items[].title` is required.' })
              .min(1, { message: '`feature-strip.items[].title` must not be empty.' }),
            description: z
              .string({ message: '`feature-strip.items[].description` is required.' })
              .min(1, { message: '`feature-strip.items[].description` must not be empty.' }),
          })
          .strict(),
      )
      .min(3, { message: '`feature-strip.items` must contain at least three items.' })
      .max(6, { message: '`feature-strip.items` can contain at most six items.' }),
  })
  .strict();
```

- [ ] **Step 2: Rewrite `src/blocks/feature-strip/index.astro`**

```astro
---
import CheckerboardDivider from '../../components/checkerboard-divider.astro';
import Lucide from '../../components/lucide.astro';

type Props = {
  type: 'feature-strip';
  title: string;
  items: { icon: string; title: string; description: string }[];
};

const { title, items } = Astro.props;
---
<CheckerboardDivider />
<section class="bg-foreground text-background py-20 px-6">
  <div class="mx-auto max-w-7xl">
    <h2 class="text-5xl md:text-6xl font-black text-center mb-16">{title}</h2>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <div class="bg-background text-foreground p-6 text-center">
          <Lucide name={item.icon} class="w-12 h-12 mx-auto mb-4" />
          <h3 class="text-xl font-black mb-2">{item.title}</h3>
          <p class="font-semibold">{item.description}</p>
        </div>
      ))}
    </div>
  </div>
</section>
<CheckerboardDivider />
```

- [ ] **Step 3: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/blocks/feature-strip
git commit -m "$(cat <<'EOF'
Implement feature-strip block (ROB-1986)

Black full-bleed section. Yellow heading; 4-up grid (responsive
2-up/1-up) of yellow tiles with black text. Emits checkerboard
dividers at top and bottom of its own markup.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Implement the `pricing` block

**Files:**
- Rewrite: `src/blocks/pricing/schema.ts`
- Rewrite: `src/blocks/pricing/index.astro`

Yellow full-bleed section. Centered title, 3-up plan cards. One plan may set `featured: true` to invert (black bg) and scale up. Each card has a list of features (with a Lucide `star` icon) and a single full-width CTA. No dividers.

- [ ] **Step 1: Rewrite `src/blocks/pricing/schema.ts`**

```ts
import { z } from 'astro:content';

export const pricingSchema = z
  .object({
    type: z.literal('pricing'),
    title: z
      .string({ message: '`pricing.title` is required.' })
      .min(1, { message: '`pricing.title` must not be empty.' }),
    plans: z
      .array(
        z
          .object({
            name: z
              .string({ message: '`pricing.plans[].name` is required.' })
              .min(1, { message: '`pricing.plans[].name` must not be empty.' }),
            price: z
              .string({ message: '`pricing.plans[].price` is required.' })
              .min(1, { message: '`pricing.plans[].price` must not be empty.' }),
            unit: z
              .string({ message: '`pricing.plans[].unit` is required.' })
              .min(1, { message: '`pricing.plans[].unit` must not be empty.' }),
            features: z
              .array(z.string().min(1, { message: '`pricing.plans[].features[]` must not be empty.' }))
              .min(1, { message: '`pricing.plans[].features` must contain at least one feature.' }),
            featured: z.boolean().default(false),
            cta: z
              .object({
                label: z
                  .string({ message: '`pricing.plans[].cta.label` is required.' })
                  .min(1, { message: '`pricing.plans[].cta.label` must not be empty.' }),
                href: z
                  .string({ message: '`pricing.plans[].cta.href` is required.' })
                  .min(1, { message: '`pricing.plans[].cta.href` must not be empty.' }),
              })
              .strict(),
          })
          .strict(),
      )
      .min(2, { message: '`pricing.plans` must contain at least two plans.' })
      .max(4, { message: '`pricing.plans` can contain at most four plans.' }),
  })
  .strict();
```

- [ ] **Step 2: Rewrite `src/blocks/pricing/index.astro`**

```astro
---
import Lucide from '../../components/lucide.astro';

type Plan = {
  name: string;
  price: string;
  unit: string;
  features: string[];
  featured: boolean;
  cta: { label: string; href: string };
};

type Props = {
  type: 'pricing';
  title: string;
  plans: Plan[];
};

const { title, plans } = Astro.props;
---
<section class="bg-background text-foreground py-20 px-6">
  <div class="mx-auto max-w-7xl">
    <h2 class="text-5xl md:text-6xl font-black text-center mb-16">{title}</h2>
    <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {plans.map((plan) => (
        <article
          class:list={[
            'p-8 text-center border-4 flex flex-col',
            plan.featured
              ? 'bg-foreground text-background border-background scale-105'
              : 'bg-secondary text-foreground border-foreground',
          ]}
        >
          <h3 class="text-2xl font-black mb-4">{plan.name}</h3>
          <div class="text-5xl font-black mb-2">{plan.price}</div>
          <div class="text-lg font-bold mb-6 opacity-80">{plan.unit}</div>
          <ul class="space-y-3 mb-8 text-left">
            {plan.features.map((feature) => (
              <li class="flex items-center font-semibold">
                <Lucide name="star" class="w-5 h-5 mr-2 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href={plan.cta.href}
            class:list={[
              'mt-auto inline-flex items-center justify-center w-full font-bold text-lg py-6 transition-colors',
              plan.featured
                ? 'bg-background text-foreground hover:bg-background/90'
                : 'bg-foreground text-background hover:bg-foreground/90',
            ]}
          >
            {plan.cta.label}
          </a>
        </article>
      ))}
    </div>
  </div>
</section>
```

`mt-auto` on the CTA + `flex flex-col` on the card pins CTAs to the bottom regardless of feature-list length.

- [ ] **Step 3: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/blocks/pricing
git commit -m "$(cat <<'EOF'
Implement pricing block (ROB-1987)

Yellow full-bleed section. 2–4 plan cards in a 3-up grid; a plan may
set featured: true to invert (black bg) and scale-105. Star icon per
feature; full-width CTA pinned to card bottom.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Implement the `cta-banner` block

**Files:**
- Rewrite: `src/blocks/cta-banner/schema.ts`
- Rewrite: `src/blocks/cta-banner/index.astro`

Black full-bleed section. Yellow heading + body, 1–2 buttons. Emits dividers top + bottom.

- [ ] **Step 1: Rewrite `src/blocks/cta-banner/schema.ts`**

```ts
import { z } from 'astro:content';
import { buttonSchema } from '../_shared/button-schema';

export const ctaBannerSchema = z
  .object({
    type: z.literal('cta-banner'),
    title: z
      .string({ message: '`cta-banner.title` is required.' })
      .min(1, { message: '`cta-banner.title` must not be empty.' }),
    text: z
      .string({ message: '`cta-banner.text` is required.' })
      .min(1, { message: '`cta-banner.text` must not be empty.' }),
    buttons: z
      .array(buttonSchema)
      .min(1, { message: '`cta-banner.buttons` must contain at least one button.' })
      .max(2, { message: '`cta-banner.buttons` can contain at most two buttons.' }),
  })
  .strict();
```

- [ ] **Step 2: Rewrite `src/blocks/cta-banner/index.astro`**

```astro
---
import CheckerboardDivider from '../../components/checkerboard-divider.astro';
import Lucide from '../../components/lucide.astro';

type Props = {
  type: 'cta-banner';
  title: string;
  text: string;
  buttons: {
    label: string;
    href: string;
    variant: 'filled' | 'outlined';
    icon?: string;
  }[];
};

const { title, text, buttons } = Astro.props;
---
<CheckerboardDivider />
<section class="bg-foreground text-background py-20 px-6">
  <div class="mx-auto max-w-4xl text-center">
    <h2 class="text-5xl md:text-6xl font-black mb-6">{title}</h2>
    <p class="text-xl font-semibold mb-10 opacity-90">{text}</p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
      {buttons.map((button) => (
        <a
          href={button.href}
          class:list={[
            'inline-flex items-center justify-center font-bold text-lg px-10 py-6 transition-colors',
            button.variant === 'filled'
              ? 'bg-background text-foreground hover:bg-background/90'
              : 'border-4 border-background text-background hover:bg-background hover:text-foreground',
          ]}
        >
          {button.icon && <Lucide name={button.icon} class="mr-2 w-5 h-5" />}
          {button.label}
        </a>
      ))}
    </div>
  </div>
</section>
<CheckerboardDivider />
```

Color polarity is inverted vs hero (this is black-bg): filled buttons are yellow-on-black; outlined buttons are yellow border / yellow text.

- [ ] **Step 3: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/blocks/cta-banner
git commit -m "$(cat <<'EOF'
Implement cta-banner block (ROB-1988)

Black full-bleed section. Yellow heading + body + 1–2 buttons baseline
aligned. Emits checkerboard dividers at top and bottom of its own
markup.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Build the `SiteNav` chrome component

**Files:**
- Create: `src/components/site-nav.astro`

Replaces the inline nav inside `base-layout.astro`. HOTROD wordmark on the left, four nav links in the middle, "Book Now" yellow-on-black-inverted button on the right.

- [ ] **Step 1: Create `src/components/site-nav.astro`**

```astro
---
const links = [
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];
---
<header class="bg-primary text-primary-foreground">
  <nav class="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
    <a href="/" class="text-2xl font-black tracking-tight">HOTROD</a>
    <ul class="hidden md:flex items-center gap-8 font-bold">
      {links.map((link) => (
        <li>
          <a href={link.href} class="hover:underline underline-offset-4">{link.label}</a>
        </li>
      ))}
    </ul>
    <a
      href="/contact"
      class="inline-flex items-center justify-center bg-primary-foreground text-primary font-bold px-4 py-2 hover:bg-primary-foreground/90 transition-colors"
    >
      Book Now
    </a>
  </nav>
</header>
```

The Book Now button stays visible on mobile (the nav link list is what's hidden via `hidden md:flex`).

- [ ] **Step 2: Commit**

```bash
git add src/components/site-nav.astro
git commit -m "$(cat <<'EOF'
Add <SiteNav> chrome component (ROB-1982)

Header strip with HOTROD wordmark, four nav links (Services, Pricing,
About, Contact), and a Book Now CTA pointing at /contact. Nav links
hidden on mobile; Book Now stays visible. Re-scoped from a pagebuilder
block to site chrome during ROB-1993 design.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Build the `SiteFooter` chrome component

**Files:**
- Create: `src/components/site-footer.astro`

Yellow footer with HOTROD wordmark, three legal/support links, and a "Hotrod is built by Roboto Studio." tagline.

- [ ] **Step 1: Create `src/components/site-footer.astro`**

```astro
---
const links = [
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Support', href: '/support' },
];
---
<footer class="bg-background text-foreground py-12 px-6">
  <div class="mx-auto max-w-7xl">
    <div class="flex flex-col md:flex-row items-center justify-between gap-6">
      <a href="/" class="text-2xl font-black tracking-tight">HOTROD</a>
      <ul class="flex items-center gap-8 font-bold">
        {links.map((link) => (
          <li>
            <a href={link.href} class="hover:underline underline-offset-4">{link.label}</a>
          </li>
        ))}
      </ul>
    </div>
    <p class="mt-8 pt-8 border-t-4 border-foreground text-center font-semibold">
      Hotrod is built by
      {' '}
      <a
        href="https://robotostudio.com"
        target="_blank"
        rel="noopener"
        class="underline underline-offset-4 hover:no-underline"
      >Roboto Studio</a>.
    </p>
  </div>
</footer>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/site-footer.astro
git commit -m "$(cat <<'EOF'
Add <SiteFooter> chrome component (ROB-1989)

Yellow footer with HOTROD wordmark, Privacy/Terms/Support links, and a
"Hotrod is built by Roboto Studio." tagline (external link to
robotostudio.com). Re-scoped from a pagebuilder block to site chrome
during ROB-1993 design.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Update `base-layout.astro` to wire chrome + add footer divider

**Files:**
- Modify: `src/layouts/base-layout.astro`

Swap the inline `<header>` and `<footer>` for `<SiteNav>` and `<SiteFooter>`. Keep the existing `<CheckerboardDivider />` between header and `<slot />`. Add a new `<CheckerboardDivider />` below the footer.

- [ ] **Step 1: Read the existing file to confirm structure**

(Read `src/layouts/base-layout.astro` so you have the imports, head block, and body shape in context. You'll only be changing the body region.)

- [ ] **Step 2: Rewrite the body region of `src/layouts/base-layout.astro`**

The full body region should read (keep `<head>` exactly as it is today):

```astro
  <body class="min-h-screen bg-background text-foreground font-sans antialiased">
    <SiteNav />

    <CheckerboardDivider />

    <main class="min-h-[60vh]">
      <slot />
    </main>

    <SiteFooter />

    <CheckerboardDivider />
  </body>
```

And update the imports at the top of the frontmatter to add:

```ts
import SiteNav from '../components/site-nav.astro';
import SiteFooter from '../components/site-footer.astro';
```

Remove the inline `<header>...<nav>` and `<footer>...</footer>` blocks entirely; their content has moved into the new components.

- [ ] **Step 3: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 4: Run `pnpm build`**

Run: `pnpm build`
Expected: PASS, 7 routes. Existing pages still render — the chrome change is visible, but the body-only paths still go through `<PageLayout>` and have no `blocks` field.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/base-layout.astro
git commit -m "$(cat <<'EOF'
Wire <SiteNav> and <SiteFooter> into base-layout

Replaces the inline header/footer markup with the chrome components.
Adds a checkerboard divider below the footer to match v0. Keeps the
existing header-bottom divider.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Drop `<PageSections>` and simplify the dispatcher

**Files:**
- Modify: `src/pages/[...slug].astro` — remove `<PageSections>` import + wrapper.
- Delete: `src/components/page-sections.astro`

Now that dividers live inside blocks and each block is a full-bleed section, there's no inter-block layout to wrap.

- [ ] **Step 1: Rewrite `src/pages/[...slug].astro`**

Replace the whole file with:

```astro
---
import BaseLayout from '../layouts/base-layout.astro';
import PageLayout from '../layouts/page-layout.astro';
import { blockComponents } from '../blocks/registry';
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
const { title, description, publishedAt, updatedAt, blocks } = entry.data;
const { Content } = await render(entry);
---

{
  blocks ? (
    <BaseLayout
      title={title}
      description={description}
      publishedAt={publishedAt}
      updatedAt={updatedAt}
    >
      {blocks.map((block) => {
        // see ROB-1993: registry lookup is total (satisfies clause).
        const Component = blockComponents[block.type] as (_props: typeof block) => unknown;
        return <Component {...block} />;
      })}
    </BaseLayout>
  ) : (
    <PageLayout
      title={title}
      description={description}
      publishedAt={publishedAt}
      updatedAt={updatedAt}
    >
      <Content />
    </PageLayout>
  )
}
```

- [ ] **Step 2: Delete the file**

```bash
git rm src/components/page-sections.astro
```

- [ ] **Step 3: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 4: Run `pnpm build`**

Run: `pnpm build`
Expected: PASS, 7 routes — existing pages all body-only, no `blocks` field, so the dispatcher takes the fallback branch.

- [ ] **Step 5: Commit**

```bash
git add src/pages/[...slug].astro src/components/page-sections.astro
git commit -m "$(cat <<'EOF'
Drop <PageSections> wrapper

Black-bg blocks now own their checkerboard dividers internally and
each block is a self-contained full-bleed section, so there is no
inter-block layout left to wrap. The dispatcher renders blocks
directly inside <BaseLayout>; page-sections.astro is deleted.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Migrate the homepage to block composition

**Files:**
- Rewrite: `src/content/pages/index.mdx`

Replace the existing body-only homepage with the v0's full content as block frontmatter.

- [ ] **Step 1: Rewrite `src/content/pages/index.mdx`**

```mdx
---
title: "Hotrod — Fast. Safe. Reliable."
description: "Your trusted ride across the city. Available 24/7, rain or shine."
publishedAt: 2026-05-12
updatedAt: 2026-05-13
blocks:
  - type: hero
    title: "FAST. SAFE. ==RELIABLE.=="
    text: "Your trusted ride across the city. Available 24/7, rain or shine."
    buttons:
      - label: "Call Now: 1-800-TAXI"
        href: "tel:1-800-8294"
        variant: filled
        icon: phone
      - label: "Book Online"
        href: "/contact"
        variant: outlined
        icon: map-pin
  - type: figures
    items:
      - value: "500K+"
        label: "Happy Riders"
      - value: "1000+"
        label: "Active Drivers"
      - value: "24/7"
        label: "Available"
      - value: "4.9★"
        label: "Rating"
  - type: card-grid
    title: "OUR SERVICES"
    items:
      - icon: car
        title: "CITY RIDES"
        description: "Quick and comfortable rides anywhere in the city. Fixed rates, no surge pricing."
      - icon: zap
        title: "EXPRESS"
        description: "Priority pickup in under 3 minutes. For when you need to be there fast."
      - icon: users
        title: "GROUP TRAVEL"
        description: "Spacious vehicles for groups up to 8. Perfect for events and airport transfers."
  - type: feature-strip
    title: "WHY CHOOSE US"
    items:
      - icon: clock
        title: "ALWAYS ON TIME"
        description: "Punctuality guaranteed or your ride is free"
      - icon: shield
        title: "100% SAFE"
        description: "Verified drivers and tracked rides"
      - icon: star
        title: "TOP RATED"
        description: "4.9 stars from 500K+ customers"
      - icon: zap
        title: "FAST PICKUP"
        description: "Average wait time under 5 minutes"
  - type: pricing
    title: "SIMPLE PRICING"
    plans:
      - name: "STANDARD"
        price: "$2.50"
        unit: "/mile"
        features:
          - "Comfortable sedan"
          - "Up to 4 passengers"
          - "A/C included"
          - "5 min avg pickup"
        cta:
          label: "SELECT"
          href: "/contact"
      - name: "EXPRESS"
        price: "$3.50"
        unit: "/mile"
        featured: true
        features:
          - "Priority pickup"
          - "Premium vehicles"
          - "Under 3 min pickup"
          - "Priority routes"
        cta:
          label: "SELECT"
          href: "/contact"
      - name: "GROUP"
        price: "$4.00"
        unit: "/mile"
        features:
          - "XL vehicles"
          - "Up to 8 passengers"
          - "Extra luggage space"
          - "Perfect for events"
        cta:
          label: "SELECT"
          href: "/contact"
  - type: cta-banner
    title: "READY TO RIDE?"
    text: "Download our app or call us now for instant pickup"
    buttons:
      - label: "Download App"
        href: "/contact"
        variant: filled
      - label: "1-800-TAXI"
        href: "tel:1-800-8294"
        variant: outlined
        icon: phone
---
```

The MDX body is empty.

- [ ] **Step 2: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 3: Run `pnpm build`**

Run: `pnpm build`
Expected: PASS, 7 routes. The homepage now generates from the block-composed branch.

- [ ] **Step 4: Visually smoke the homepage**

Run `pnpm dev` (foreground or background). Open `http://localhost:4321/` and confirm visually that the section order, palette, dividers, highlight pill on RELIABLE., featured pricing card, and button alignment all match the v0 reference (`https://vm-7mjg6bult8smxygl9xlq5srw.vusercontent.net/`).

If the agent can't open a browser, do a `curl -s http://localhost:4321/ | grep -c CheckerboardDivider` — the homepage should contain six `<CheckerboardDivider />` strips above/below the three black-bg blocks (6 total) plus base-layout's two (one after header, one after footer) = 8 dividers. Report the actual count.

Stop the dev server when done.

- [ ] **Step 5: Commit**

```bash
git add src/content/pages/index.mdx
git commit -m "$(cat <<'EOF'
Migrate homepage to block-composed model (ROB-1995, partial)

src/content/pages/index.mdx now drives the homepage via the
pagebuilder framework: hero, figures, card-grid, feature-strip,
pricing, cta-banner. Content matches the v0 taxi landing page 1:1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Add stub destination pages so nav links don't 404

**Files:**
- Create: `src/content/pages/services.mdx`
- Create: `src/content/pages/pricing.mdx`
- Create: `src/content/pages/contact.mdx`

Each stub uses the same two-block pattern (hero + cta-banner) so authors learn it by example.

- [ ] **Step 1: Create `src/content/pages/services.mdx`**

```mdx
---
title: "Services — Hotrod"
description: "What we offer. Detailed services pages are coming soon."
publishedAt: 2026-05-13
blocks:
  - type: hero
    title: "==SERVICES.=="
    text: "Detailed services pages are coming soon. In the meantime, get in touch."
    buttons:
      - label: "Get in touch"
        href: "/contact"
        variant: filled
        icon: map-pin
  - type: cta-banner
    title: "READY WHEN YOU ARE."
    text: "Talk to the team to find the right service for your trip."
    buttons:
      - label: "Contact us"
        href: "/contact"
        variant: filled
---
```

- [ ] **Step 2: Create `src/content/pages/pricing.mdx`**

```mdx
---
title: "Pricing — Hotrod"
description: "Simple, transparent pricing across every Hotrod service."
publishedAt: 2026-05-13
blocks:
  - type: hero
    title: "==PRICING.=="
    text: "Simple, transparent pricing across every Hotrod service. See the homepage for current rates."
    buttons:
      - label: "View rates on the homepage"
        href: "/"
        variant: filled
  - type: cta-banner
    title: "QUESTIONS?"
    text: "Talk to the team about volume discounts, corporate accounts, or anything else."
    buttons:
      - label: "Contact us"
        href: "/contact"
        variant: filled
---
```

- [ ] **Step 3: Create `src/content/pages/contact.mdx`**

```mdx
---
title: "Contact — Hotrod"
description: "Get in touch with Hotrod. Call us or write a note."
publishedAt: 2026-05-13
blocks:
  - type: hero
    title: "==GET IN TOUCH.=="
    text: "Reach out and someone will get back to you within one business day."
    buttons:
      - label: "Call 1-800-TAXI"
        href: "tel:1-800-8294"
        variant: filled
        icon: phone
      - label: "Email us"
        href: "mailto:hello@hotrod.example"
        variant: outlined
  - type: cta-banner
    title: "PREFER TO BOOK?"
    text: "Head back to the homepage to book a ride right now."
    buttons:
      - label: "Book a ride"
        href: "/"
        variant: filled
---
```

- [ ] **Step 4: Run `pnpm astro check`**

Run: `pnpm astro check`
Expected: 0 errors.

- [ ] **Step 5: Run `pnpm build`**

Run: `pnpm build`
Expected: PASS, 10 routes — adds `/services`, `/pricing`, `/contact`.

- [ ] **Step 6: Commit**

```bash
git add src/content/pages/services.mdx src/content/pages/pricing.mdx src/content/pages/contact.mdx
git commit -m "$(cat <<'EOF'
Add stub /services, /pricing, /contact pages

Hero + cta-banner stubs so the nav links resolve without 404s. Each
follows the same two-block pattern as an authoring example.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: Final verification

- [ ] **Step 1: `pnpm astro check`** — PASS, 0 errors.

- [ ] **Step 2: `pnpm build`** — PASS, 10 routes:
  - `/`
  - `/about`
  - `/services`
  - `/services/astro`
  - `/pricing`
  - `/contact`
  - `/blog`
  - `/blog/welcome-to-hotrod`
  - `/authors`
  - `/authors/jono`

- [ ] **Step 3: Boot the dev server and smoke each route**

Run `pnpm dev`. Visit each URL above and confirm:
- `/` matches the v0 reference section-by-section (hero highlight, figures stats, services cards, features tiles, pricing with featured Express, cta-banner, footer tagline).
- `/about` still renders the existing body-only MDX with the auto-h1 + prose styling (no regression).
- `/services`, `/pricing`, `/contact` render their stub hero + cta-banner pairs with the new chrome.
- `/blog`, `/blog/welcome-to-hotrod`, `/authors`, `/authors/jono` render unchanged (hardcoded `.astro` index routes plus the existing MDX body path).

Stop the dev server.

- [ ] **Step 4: Confirm clean working tree**

```bash
git status
```

Expected: clean.

- [ ] **Step 5: Mark Linear tickets as Done**

After the human has confirmed the visual smoke, mark each of ROB-1982, ROB-1983, ROB-1984, ROB-1985, ROB-1986, ROB-1987, ROB-1988, ROB-1989, ROB-1994, ROB-1995 to status `Done`. Skip if the controller will handle this separately.

- [ ] **Step 6: Update `docs/next-up.md`**

Mark Phase 3 + ROB-1994 + ROB-1995 as shipped in the roadmap; advance to Phase 4 (media) as next-up. Commit.

---

## Out-of-band follow-ups (do not do in this sprint)

- Mobile nav menu (hamburger).
- Real `/legal/privacy`, `/legal/terms`, `/support` pages.
- Real services / pricing / contact content (stubs only).
- Image / video block schemas (Phase 4).
- Agent-facing `CLAUDE.md` (ROB-1996), which will document the recommended Lucide icon starter set.
