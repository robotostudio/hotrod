# Phase 1: Deploy to Vercel — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the existing static Astro site to Vercel under the production domain `hotrod.robotostudio.com`, with the `@astrojs/vercel` adapter installed so Phase 2 (Blob + Mux) is purely additive.

**Architecture:** Add `@astrojs/vercel` in static mode with `imageService: true`, point the already-linked `roboto-pro/hotrod` Vercel project at GitHub for auto-deploys, document the workflow in the README, and wire the custom domain. No `src/**` changes, no `vercel.json`, no `src/env.ts` (deferred to Phase 2).

**Tech Stack:** Astro 6, `@astrojs/vercel` adapter, Vercel (hosting + image CDN), pnpm 10, Node 22.

**Spec:** `docs/superpowers/specs/2026-05-12-vercel-deploy-design.md`

**Verification convention:** Hotrod has no test framework configured. Per `docs/next-up.md`, verification is `pnpm astro check` (types) + `pnpm build` (route generation + schema validation) + ad-hoc Playwright smoke checks via MCP. Tasks below follow that pattern instead of classic TDD: make the change, run the build, then commit.

**User-blocking steps:** Tasks 7 (push + Vercel build), 8 (custom domain), and the secret-rotation reminder require human action (DNS edits, Vercel dashboard clicks, key rotation). Each is marked clearly and includes a wait-for-confirmation gate.

---

## Task 1: Install the `@astrojs/vercel` adapter

**Files:**
- Modify: `package.json` (dependencies block)
- Modify: `pnpm-lock.yaml` (regenerated)

- [ ] **Step 1: Check current dependencies**

Run: `cat package.json | grep -A 10 '"dependencies"'`
Expected: shows `@astrojs/mdx`, `@tailwindcss/typography`, `@tailwindcss/vite`, `astro`, `tailwindcss`. No `@astrojs/vercel` yet.

- [ ] **Step 2: Install the adapter**

Run: `pnpm add @astrojs/vercel`

Expected: pnpm resolves the latest version compatible with Astro 6 (at time of writing, `^8.x`). The lockfile updates. The `package.json` `dependencies` block gains a new line.

If pnpm warns about peer-dependency mismatch with Astro 6, STOP and report. Do not force-install.

- [ ] **Step 3: Verify the dep landed cleanly**

Run: `cat package.json` and confirm `@astrojs/vercel` appears under `dependencies` with a version like `"^8.x.y"`.

Run: `ls node_modules/@astrojs/vercel/dist` — confirm the adapter is installed (you should see compiled adapter entry files).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
Add @astrojs/vercel adapter dependency

Phase 1 deploy prep — adapter unlocks image optimization and a
future-ready path to SSR/middleware without further config.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Wire the adapter into `astro.config.mjs`

**Files:**
- Modify: `astro.config.mjs`

- [ ] **Step 1: Read the current config**

Current contents (for reference):

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

- [ ] **Step 2: Update the config**

Replace the entire file contents with:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: vercel({
    imageService: true,
  }),
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

What changed:
- New import: `import vercel from '@astrojs/vercel';`
- New top-level option: `output: 'static'` (explicit, even though it's the default — clarity for future readers).
- New top-level option: `adapter: vercel({ imageService: true })` — enables Vercel's image CDN for any future `<Image>` usage.

- [ ] **Step 3: Run type check**

Run: `pnpm astro check`

Expected: 0 errors, 0 warnings. Astro picks up the adapter type from the new dependency.

If it reports an error about the `vercel` import, the package may have been installed but not yet wired into Astro's type resolution. Try `pnpm install` once more, then re-run.

- [ ] **Step 4: Run a local build**

Run: `pnpm build`

Expected output should include a line like `using @astrojs/vercel adapter` and finish with the usual "Completed in Xs" message. The same routes that built before should still build:
- `/index.html`
- `/about/index.html`
- `/services/astro/index.html`
- `/blog/index.html` plus one entry per published blog post under `/blog/<slug>/index.html`
- `/authors/index.html` plus one entry per author under `/authors/<slug>/index.html`

Plus a new `.vercel/output/` directory (the adapter's build artifact, used by Vercel's build pipeline). This is gitignored in Task 4.

If the build fails or produces zero routes, STOP and report the error.

- [ ] **Step 5: Commit**

```bash
git add astro.config.mjs
git commit -m "$(cat <<'EOF'
Wire @astrojs/vercel adapter into astro.config

Sets output: 'static' (explicit) and imageService: true so future
<Image> usage routes through Vercel's CDN automatically.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Harden `.gitignore`

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Read the current `.gitignore`**

The current file already has `.env` and `.env.production`. It does NOT have `.env.local`, `.env.*.local`, or `.vercel/`. Phase 1 adds those three.

- [ ] **Step 2: Replace the "environment variables" block**

Find this block:

```
# environment variables
.env
.env.production
```

Replace with:

```
# environment variables
.env
.env.local
.env.*.local
.env.production

# vercel cli — per-developer linked project metadata + adapter build output
.vercel/
```

Order matters minimally; Vercel CLI writes per-developer metadata under `.vercel/` that should not be committed, and the adapter writes its build output under `.vercel/output/` (also not committed). One pattern covers both.

- [ ] **Step 3: Verify nothing tracked is now ignored unintentionally**

Run: `git ls-files .vercel/ .env.local 2>/dev/null | head`

Expected: empty output. If anything appears, those files were committed earlier and must be removed:

```bash
git rm -r --cached .vercel/ .env.local
```

(Only run the above if the previous command produced output.)

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "$(cat <<'EOF'
Ignore .env.local variants and .vercel/

Keeps per-developer Vercel CLI metadata and adapter build output
out of git, plus the local env file Phase 2 will populate via
vercel env pull.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Add `.env.example`

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create the file**

Write `.env.example` at the repo root with these exact contents:

```
# Hotrod environment variables.
# Real values live in the Vercel project (roboto-pro/hotrod) — never commit them.
# Sync them locally with: pnpm dlx vercel env pull .env.local

# Vercel Blob — public asset storage for content images
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_*"

# Mux — video upload and playback
MUX_TOKEN_ID="*"
MUX_TOKEN_SECRET="*"
```

Values are placeholders only. The `*` makes it visually obvious to a reader that these are not real.

- [ ] **Step 2: Confirm it's not gitignored**

Run: `git check-ignore .env.example`

Expected: exit code 1 and no output (meaning the file is NOT ignored, which is what we want — only `.env`, `.env.local`, `.env.*.local`, and `.env.production` are ignored).

If `.env.example` shows up as ignored, the `.gitignore` pattern in Task 3 was too aggressive — re-check it.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "$(cat <<'EOF'
Add .env.example documenting Phase 2 env var names

Placeholders only; real secrets live in the linked Vercel project
and are pulled locally via vercel env pull. src/env.ts (Zod-
validated parsing) is deferred to Phase 2 when the consuming code
lands.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Add a "Deploying" section to `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Locate the insertion point**

The new section goes between `## Commands` and `## License`. The current `## Commands` section ends at the line containing `| pnpm astro ...` and is followed by `## License`.

- [ ] **Step 2: Insert the new section**

Add the following section after the Commands table and before `## License`:

```markdown
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
```

(Important: when inserting into the actual file, the inner ```sh and ```markdown fences need to remain literal — they're showing as fenced code blocks inside the README itself.)

- [ ] **Step 3: Sanity-check the rendering**

Run: `head -120 README.md` and confirm the new "Deploying" section sits between Commands and License with no broken markdown.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
Document Vercel deploy workflow in README

Adds the Deploying section: production at hotrod.robotostudio.com,
push-to-deploy via Vercel's GitHub integration, vercel env pull
workflow for local env sync, and pnpm preview for build sanity-
checks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Pre-push verification

**Files:** none modified — verification only.

- [ ] **Step 1: Confirm working tree is clean**

Run: `git status`
Expected: "nothing to commit, working tree clean"

If anything is modified, the previous tasks didn't commit cleanly. Stop and investigate.

- [ ] **Step 2: Full clean rebuild**

```bash
rm -rf dist .vercel/output node_modules/.astro
pnpm install
pnpm astro check
pnpm build
```

Expected:
- `pnpm install` is a no-op or quick re-link (deps already in lockfile).
- `pnpm astro check` reports 0 errors, 0 warnings.
- `pnpm build` completes, listing all expected routes (same list as Task 2 Step 4), shows the Vercel adapter line, and writes both `dist/` and `.vercel/output/`.

- [ ] **Step 3: Confirm commit history**

Run: `git log --oneline main..HEAD` if on a feature branch, else `git log --oneline -6`.

Expected: 5 new commits from Tasks 1–5 plus the spec commit (`520c5a9`) already on main.

---

## Task 7: First Vercel deploy (user-blocking)

This task requires pushing to GitHub and watching the Vercel build. The agent runs the push; the user confirms what Vercel does.

**Files:** none modified.

- [ ] **Step 1: Push to `main`**

```bash
git push origin main
```

Expected: push succeeds, no rejection.

- [ ] **Step 2: Watch the Vercel deploy**

The user opens `https://vercel.com/roboto-pro/hotrod` (or runs `pnpm dlx vercel ls` and `pnpm dlx vercel logs <url>`) to watch the build.

Build log should show:
- Cloning `robotostudio/hotrod` at the latest `main` commit
- Detecting Astro framework
- Using Node 22.x (from `engines.node`)
- Using pnpm 10.x (from `packageManager`)
- Running `pnpm install` then the auto-detected build command
- Logging the `@astrojs/vercel` adapter
- Producing the deployment URL

- [ ] **Step 3: Verify the auto URL**

Once the build is green, the user opens the deployment URL (looks like `https://hotrod-<hash>-roboto-pro.vercel.app` or simply the project's auto-assigned domain) and confirms these routes all return 200 with the expected content:

- `/`
- `/about`
- `/services/astro`
- `/blog`
- One blog post page (whatever entry exists under `src/content/blog/`)
- `/authors`
- One author page (whatever entry exists under `src/content/authors/`)

- [ ] **Step 4: Wait-for-confirmation gate**

STOP here. Ask the user to confirm:
1. Build succeeded.
2. All routes serve.
3. No surprising warnings in the build log.

Only proceed to Task 8 once confirmed. If anything failed, debug from the build log first before changing config.

---

## Task 8: Wire the custom domain (user-blocking)

**Files:** none modified.

The user handles DNS and dashboard clicks. The agent's job is checking it works.

- [ ] **Step 1: User adds the domain in Vercel**

User navigates to `https://vercel.com/roboto-pro/hotrod/settings/domains` and clicks "Add Domain". Enters `hotrod.robotostudio.com`. Vercel will display the required DNS record — almost certainly `CNAME hotrod → cname.vercel-dns.com`.

- [ ] **Step 2: User adds the DNS record**

User adds the `CNAME hotrod → cname.vercel-dns.com` record at the DNS host that manages `robotostudio.com` (Cloudflare, Route 53, the registrar, wherever).

- [ ] **Step 3: Wait for propagation**

DNS propagation usually takes seconds to minutes for a fresh subdomain, but can take longer. Vercel polls and provisions a TLS cert automatically once it sees the record.

The user signals readiness when Vercel's dashboard shows the domain as "Valid Configuration" with TLS active.

- [ ] **Step 4: Agent verifies the domain serves**

Run:

```bash
curl -sI https://hotrod.robotostudio.com/ | head -1
```

Expected: `HTTP/2 200`

If not 200, but a 308 or 301: check that it's redirecting to `https://hotrod.robotostudio.com/` (Vercel's HTTP→HTTPS or apex→subdomain handling), then re-curl the final URL.

Run additionally:

```bash
curl -sI http://hotrod.robotostudio.com/ | head -3
```

Expected: a 308 or 301 to `https://hotrod.robotostudio.com/` (Vercel's automatic HTTP→HTTPS redirect).

- [ ] **Step 5: Wait-for-confirmation gate**

STOP. Confirm with the user that:
1. The domain is showing as healthy in the Vercel dashboard.
2. TLS cert is provisioned (no browser warning).
3. The site loads at `https://hotrod.robotostudio.com/`.

Only proceed to Task 9 after confirmation.

---

## Task 9: Live-domain smoke check via Playwright MCP

**Files:** none modified — read-only verification against production.

This is an ad-hoc check run by the agent through the Playwright MCP server. No test framework is added.

- [ ] **Step 1: Smoke-check the homepage**

Use the Playwright MCP to navigate to `https://hotrod.robotostudio.com/`. Confirm:
- Page status 200.
- Page title contains "Hotrod" (or whatever the homepage `<title>` resolves to from the layout — check `src/layouts/` if unsure).
- No console errors in the browser console.
- The expected hero / index content renders (matches what dev server shows).

- [ ] **Step 2: Smoke-check one blog post**

Navigate to `https://hotrod.robotostudio.com/blog/`, click through to the first post listed. Confirm:
- Detail page returns 200.
- Author byline renders (proves the cross-collection reference resolution worked at build time).
- Post body renders (proves MDX compilation worked through the adapter).

- [ ] **Step 3: Smoke-check the authors index**

Navigate to `https://hotrod.robotostudio.com/authors/`. Confirm 200 + at least one author card renders.

- [ ] **Step 4: Capture evidence**

Take a screenshot of the homepage and save it to `docs/superpowers/specs/2026-05-12-vercel-deploy-evidence.png` (or similar). This is not committed — it's local evidence that verification happened. If you want it kept long-term, mention it and we can decide whether to add it to the repo or store externally.

- [ ] **Step 5: Report findings to the user**

Summarise what was checked, anything unexpected, and confirm Phase 1 is verified end-to-end.

---

## Task 10: Mark Phase 1 complete in `docs/next-up.md`

**Files:**
- Modify: `docs/next-up.md`

- [ ] **Step 1: Update the Phase 1 section**

Locate the `## Phase 1 — Deploy to Vercel` heading. Replace it with `## Phase 1 — Deploy to Vercel ✅` (the checkmark signals done at a glance).

Below that heading, replace the existing Scope/Out-of-scope content with a short retrospective block:

```markdown
## Phase 1 — Deploy to Vercel ✅

Shipped 2026-05-12. Production at https://hotrod.robotostudio.com.

What landed:
- `@astrojs/vercel` adapter installed in static mode with `imageService: true`.
- Vercel project `roboto-pro/hotrod` wired to GitHub for auto-deploys; `main` → production.
- `.env.example` + hardened `.gitignore`; canonical env store is Vercel.
- README "Deploying" section documents the workflow.

Spec: `docs/superpowers/specs/2026-05-12-vercel-deploy-design.md`
Plan: `docs/superpowers/plans/2026-05-12-vercel-deploy.md`
```

- [ ] **Step 2: Update the "Where we are" section**

Find the `## Where we are` section near the top of `docs/next-up.md`. Update the first line to reference the new state:

Before:
```
The first content pass is shipped on `main` (commit `d524533`).
```

After:
```
The first content pass and Phase 1 (Vercel deploy) are shipped on `main`. Production: https://hotrod.robotostudio.com.
```

- [ ] **Step 3: Commit**

```bash
git add docs/next-up.md
git commit -m "$(cat <<'EOF'
Mark Phase 1 complete in next-up.md

Phase 1 (Vercel deploy) shipped — hotrod.robotostudio.com live,
adapter installed, env workflow documented.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Push**

```bash
git push origin main
```

Expected: push succeeds; Vercel kicks off a no-op rebuild (docs-only change, but no `ignoreCommand` is configured so it rebuilds). That's expected — we agreed to skip `ignoreCommand` for now.

---

## Reminders for the user (separate from build steps)

These don't belong in any task because they're not agent-actionable, but they're load-bearing for the project's security and ergonomics. Surface them before declaring Phase 1 done:

1. **Rotate the Mux and Blob secrets that were pasted during brainstorming.** They were captured in the conversation transcript and should be treated as compromised:
   - Mux: dashboard.mux.com → Settings → Access Tokens → revoke the leaked token, generate a new one. Update `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` in Vercel (all three environments).
   - Blob: vercel.com/roboto-pro/~/stores → Blob store → Tokens → rotate. Vercel auto-updates the linked project's `BLOB_READ_WRITE_TOKEN`.
2. **Add Mux env vars to Vercel** if not already done: Dashboard → Settings → Environment Variables, or `pnpm dlx vercel env add MUX_TOKEN_ID production` (then preview, then development; repeat for `MUX_TOKEN_SECRET`).
3. **`pnpm dlx vercel link`** locally once, choosing the `roboto-pro/hotrod` project — enables `vercel env pull` and `vercel logs` from this directory. Only the user can do this; it writes to `.vercel/` which is now gitignored.

---

## Plan self-review notes

Coverage vs. spec:

- Adapter install + config → Tasks 1–2. ✓
- `.gitignore` hardening → Task 3. ✓
- `.env.example` → Task 4. ✓
- README "Deploying" section → Task 5. ✓
- Local build verification → Tasks 2 Step 4 + Task 6. ✓
- Vercel deploy + auto-URL verification → Task 7. ✓
- Custom domain wiring + TLS → Task 8. ✓
- Playwright smoke against live domain → Task 9. ✓
- Mark Phase 1 complete in `docs/next-up.md` → Task 10. ✓
- Out-of-band user tasks (rotate keys, add Mux env vars, `vercel link`) → Reminders block. ✓

No placeholders. No "TBD". All commands are exact. All file paths are exact. All commits use HEREDOC.
