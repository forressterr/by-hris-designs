# Phase 3 — Hybrid Tailwind v4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Tailwind v4 utilities available for new code with **zero visual change**, by wiring Tailwind in _without_ Preflight, bridging it to the existing `:root` design tokens via `@theme inline`, and proving the bridge by migrating one component (`Breadcrumbs`) to utilities and verifying pixel-identical computed styles in light + dark.

**Architecture:** Tailwind runs through `@tailwindcss/postcss` (a `postcss.config.mjs` Next auto-detects). `index.css` gains, at its very top, the selective layer imports (`theme.css` + `utilities.css`, **no `preflight.css`**) and an `@theme inline` block aliasing Tailwind's color/font/radius/screen namespace to the site's existing CSS variables — `inline` so color utilities resolve `var(--token)` at the use-site and flip inside `[data-theme='dark']`. Everything else in `index.css` is untouched. `Breadcrumbs.tsx` is the lone proof: its className strings become utilities and its `.breadcrumbs*` CSS block is deleted.

**Tech Stack:** Next.js 15 (Pages Router), React 19, strict TS, Tailwind v4 (`tailwindcss` + `@tailwindcss/postcss`), PostCSS.

**Spec:** `docs/superpowers/specs/2026-06-11-phase3-hybrid-tailwind-design.md`

**No test framework this phase** (deferred to Phase 5). Verification = `npm run check` + a computed-style equality proof on `Breadcrumbs` against the documented original values, in light and dark, on the production build.

**Conventions:** branch + PR; commits authored `h.goretsov <gorecov4@gmail.com>`, conventional messages, no AI trailer; **tidy-first** — engine setup (`build:`) and the component migration (`refactor:`) are separate commits; `npm run check` gate before the PR; don't merge until check + CI + Vercel preview all green and the proof passes.

---

## File map

| File                                                                 | Create/Modify | Responsibility                                                                                                                    |
| -------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `docs/superpowers/specs/2026-06-11-phase3-hybrid-tailwind-design.md` | Create        | The design (already written).                                                                                                     |
| `docs/superpowers/plans/2026-06-11-phase3-hybrid-tailwind.md`        | Create        | This plan.                                                                                                                        |
| `postcss.config.mjs`                                                 | Create        | Register the `@tailwindcss/postcss` plugin (Next auto-detects).                                                                   |
| `src/styles/index.css`                                               | Modify        | Prepend the selective Tailwind imports + `@theme inline` bridge + `@custom-variant dark`; later delete the `.breadcrumbs*` block. |
| `src/components/Breadcrumbs.tsx`                                     | Modify        | className strings → Tailwind utilities (the proof).                                                                               |
| `package.json` / `package-lock.json`                                 | Modify        | `tailwindcss` + `@tailwindcss/postcss` exact-pinned devDeps.                                                                      |

---

## Task 1: Branch + spec/plan commit

**Files:** the two docs above.

- [ ] **Step 1: Branch from clean `main`.**

```bash
git checkout main && git pull --ff-only
git checkout -b feat/phase3-hybrid-tailwind
```

- [ ] **Step 2: Commit the spec + plan** (they already exist on disk).

```bash
git add docs/superpowers/specs/2026-06-11-phase3-hybrid-tailwind-design.md \
        docs/superpowers/plans/2026-06-11-phase3-hybrid-tailwind.md
git commit --author="h.goretsov <gorecov4@gmail.com>" \
  -m "docs: add phase 3 hybrid tailwind spec and plan"
```

Expected: commitlint passes (conventional, lowercase subject).

---

## Task 2: Install Tailwind v4 + PostCSS config (engine, structural)

**Files:** Create `postcss.config.mjs`; Modify `package.json`/`package-lock.json`.

- [ ] **Step 1: Install Tailwind v4 as exact-pinned devDeps.**

```bash
npm i -D tailwindcss @tailwindcss/postcss
```

Expected: both added to `devDependencies` with exact versions (no `^`, via `.npmrc save-exact`). `tailwindcss` and `@tailwindcss/postcss` should both be `4.x`.

- [ ] **Step 2: Create `postcss.config.mjs`** (Next.js auto-detects this file):

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

- [ ] **Step 3: Confirm no other PostCSS/Tailwind config exists** (CSS-first, no `tailwind.config.js`):

```bash
ls postcss.config.* tailwind.config.* 2>/dev/null
```

Expected: only `postcss.config.mjs`.

- [ ] **Step 4: Build to confirm the empty engine compiles and changes nothing** (no `@theme`/utilities yet — Tailwind sees the config but `index.css` has no Tailwind directives, so this just proves the toolchain loads):

```bash
npm run build
```

Expected: `next build` succeeds, all 13 routes prerender as before. (Do NOT commit yet — the bridge lands with this commit in Task 3.)

---

## Task 3: Wire the Tailwind bridge into `index.css` (engine, structural)

**Files:** Modify `src/styles/index.css` (prepend only; existing rules untouched).

- [ ] **Step 1: Prepend the layer imports + bridge** to the very top of `src/styles/index.css`, **above** the opening `/* ===== By_Hris Designs — Global Stylesheet ... */` comment (CSS requires `@import` before style rules; the bare `@layer` order statement is allowed first):

```css
/* ============================================================
   Tailwind v4 — utilities only, NO Preflight.
   We import the theme + utilities layers selectively and OMIT
   preflight.css on purpose: Preflight is a reset that would
   restyle the hand-built CSS below. Utilities are JIT, so any
   class not used in the markup emits no CSS — adding the engine
   changes nothing on screen. See
   docs/superpowers/specs/2026-06-11-phase3-hybrid-tailwind-design.md
   ============================================================ */
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);

/* Bridge Tailwind's theme namespace to the existing :root design
   tokens (defined further down). `inline` is REQUIRED: it inlines
   var(--token) into each utility so colours resolve at the use-site
   and flip automatically inside [data-theme='dark'] — no `dark:`
   variant needed for colour. Plain @theme would freeze utilities to
   the light palette. The font/radius keys intentionally share names
   with the site tokens; `inline` keeps them safe by not re-emitting
   them to :root (verified by the Breadcrumbs proof). */
@theme inline {
  --color-bg: var(--bg);
  --color-fg: var(--fg);
  --color-muted: var(--muted);
  --color-muted-2: var(--muted-2);
  --color-line: var(--line);
  --color-line-strong: var(--line-strong);
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-invert-fg: var(--invert-fg);
  --color-invert-bg: var(--invert-bg);
  --color-placeholder: var(--placeholder);
  --color-placeholder-2: var(--placeholder-2);
  --color-accent-purple: var(--accent-purple);
  --color-accent-green: var(--accent-green);
  --color-accent-pink: var(--accent-pink);
  --color-accent-yellow: var(--accent-yellow);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);

  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);

  --breakpoint-sm: 700px;
  --breakpoint-md: 900px;
  --breakpoint-lg: 1024px;
}

/* Explicit dark variant for the rare case a utility needs a different
   value in dark beyond the automatic token flip above. */
@custom-variant dark (&:where([data-theme='dark'] *));
```

- [ ] **Step 2: Build + confirm zero-change + no Preflight.**

```bash
npm run build
```

Expected: build succeeds. The generated CSS must **not** contain Preflight's reset (e.g. no global `*,::after,::before{box-sizing:border-box;...}` from Tailwind, no `h1{font-size:inherit}` reset). Sanity-grep the built CSS:

```bash
# Find the built CSS and check Preflight markers are ABSENT and a bridged var is PRESENT.
find .next -name '*.css' | head
# Expect NO Tailwind Preflight margin reset like "blockquote,dl,dd,h1,h2" :
grep -l 'blockquote,dl,dd,h1' .next/static/css/*.css || echo "no preflight (good)"
```

Expected: `no preflight (good)`.

- [ ] **Step 3: Commit the engine setup** (structural — separate from the component migration):

```bash
git add package.json package-lock.json postcss.config.mjs src/styles/index.css
git commit --author="h.goretsov <gorecov4@gmail.com>" \
  -m "build: add tailwind v4 utilities (no preflight) bridged to css tokens"
```

---

## Task 4: Migrate `Breadcrumbs` to utilities (the proof, behavioral-equivalent)

**Files:** Modify `src/components/Breadcrumbs.tsx`; Modify `src/styles/index.css` (delete the `.breadcrumbs*` block).

The icon components (`HomeIcon`, `ChevronIcon`), `ROUTE_LABELS`, and the
`currentLabel`/`isDeep` logic are **unchanged**. Only the returned JSX className
strings change, and a short "why" comment is added.

- [ ] **Step 1: Replace the `return (...)` block** in `src/components/Breadcrumbs.tsx` (currently lines ~94–132) with the utility version below. Every utility is a 1:1 of the deleted CSS (arbitrary values used where a Tailwind scale value would differ — see the spec's mapping table):

```tsx
return (
  // Phase 3 proof component: migrated from the .breadcrumbs* block in
  // index.css to Tailwind utilities to validate the no-Preflight token
  // bridge (colours flip in dark via the bridged --ink/--ink-soft tokens,
  // no dark: variant). Siblings stay on index.css until next touched.
  <nav className="breadcrumbs pt-6 pb-3" aria-label="Breadcrumb">
    <ol className="flex list-none flex-wrap items-center gap-2 m-0 p-0 font-mono text-[0.75rem] tracking-[0.02em] text-ink-soft">
      <li className="flex items-center">
        <Link
          href="/"
          className="inline-flex items-center bg-transparent border-0 px-1 py-0.5 -mx-1 -my-0.5 rounded-[4px] text-ink no-underline cursor-pointer [transition:opacity_180ms_ease] hover:opacity-[0.6] focus-visible:[outline:1px_solid_var(--ink)] focus-visible:outline-offset-[2px]"
          aria-label="Home"
        >
          <HomeIcon />
        </Link>
      </li>
      <li
        className="flex items-center text-ink-soft opacity-[0.45]"
        aria-hidden="true"
      >
        <ChevronIcon />
      </li>
      {isDeep && (
        <>
          <li className="flex items-center">
            {/* "…" sends the user one step back in history. */}
            <button
              type="button"
              className="inline-flex items-center bg-transparent border-0 px-1 py-0.5 -mx-1 -my-0.5 rounded-[4px] text-ink-soft no-underline cursor-pointer [transition:opacity_180ms_ease] hover:opacity-[0.6] focus-visible:[outline:1px_solid_var(--ink)] focus-visible:outline-offset-[2px] font-mono tracking-[0.15em] leading-none"
              onClick={() => router.back()}
              aria-label="Go back one step"
            >
              …
            </button>
          </li>
          <li
            className="flex items-center text-ink-soft opacity-[0.45]"
            aria-hidden="true"
          >
            <ChevronIcon />
          </li>
        </>
      )}
      <li className="flex items-center text-ink py-0.5">
        <span aria-current="page">{currentLabel}</span>
      </li>
    </ol>
  </nav>
);
```

Notes baked into the mapping:

- The `<nav>` keeps a bare `breadcrumbs` class **only** as a stable hook for the
  computed-style inspection / any future selector — it carries no CSS after Step 2
  deletes the block. (Drop it later if unwanted; harmless.)
- `text-[0.75rem]` (not `text-xs`) so no paired `line-height` is set — the list
  keeps the inherited `line-height: 1.5`.
- `rounded-[4px]` (not `rounded-sm`) — the bridge re-points `--radius-sm` to the
  site's 8px.
- The back button needs **no** font-size utility: `button { font: inherit }` (global
  reset, retained) makes it inherit `0.75rem` from the list, matching the original
  `font-size: inherit`.
- `list-none m-0 p-0` on the `<ol>` are **required** — with Preflight omitted, the UA
  default `<ol>` padding/margin/bullets are present and the original CSS reset them.

- [ ] **Step 2: Delete the `.breadcrumbs*` CSS block** from `src/styles/index.css`
      (the section starting `/* -------- Breadcrumbs ... */` through
      `.breadcrumbs__item--current { ... }`, i.e. the `.breadcrumbs`, `__list`, `__item`,
      `__sep`, `__link`, `__link:hover`, `__link:focus-visible`, `__home`, `__back`,
      `__item--current` rules — currently lines ~359–446). Leave the surrounding
      `.labs-canvas`/`.section` rules intact. Verify nothing else references the classes:

```bash
grep -rn "breadcrumbs__" src/ --include="*.tsx" --include="*.ts" --include="*.css"
```

Expected: **no matches** (the JSX now uses utilities; the CSS block is gone). A bare
`className="breadcrumbs ..."` on the `<nav>` is fine — it's the hook, not a `__`
class.

- [ ] **Step 3: Build.**

```bash
npm run build
```

Expected: success; the breadcrumb utilities now compile into the built CSS.

- [ ] **Step 4: Commit the migration** (behavioral-equivalent refactor):

```bash
git add src/components/Breadcrumbs.tsx src/styles/index.css
git commit --author="h.goretsov <gorecov4@gmail.com>" \
  -m "refactor: migrate breadcrumbs to tailwind utilities (phase 3 proof)"
```

---

## Task 5: Verify — `npm run check` + computed-style proof (light + dark)

**Files:** none (verification only).

- [ ] **Step 1: Full gate.**

```bash
npm run check
```

Expected: green — lint, format:check, typecheck, `npm audit --audit-level=high`, build all pass. If prettier rewrites the new CSS/JSX, re-stage and amend the relevant commit.

- [ ] **Step 2: Run the production build for inspection** (stop any desktop-preview `next dev` first — it shares `.next/` and clobbers `next start`):

```bash
# stop preview if running (preview_stop), then:
npm run build && npm run start   # serves on :3000
```

- [ ] **Step 3: Computed-style equality proof.** Point the preview/inspector at the
      running prod server. On `/about` (top-level) and a `/projects/<slug>` route (deep —
      renders the `…` back button), in **light** then **dark** (toggle via the header theme
      control, or set `document.documentElement.dataset.theme`), inspect the breadcrumb and
      assert the computed values equal the originals:

| Element / selector          | Property         | Light                      | Dark                         |
| --------------------------- | ---------------- | -------------------------- | ---------------------------- |
| `.breadcrumbs` (nav)        | `padding`        | `24px 0px 12px`            | same                         |
| `.breadcrumbs > ol`         | `display`/`gap`  | `flex` / `8px`             | same                         |
| `.breadcrumbs > ol`         | `font-family`    | DM Mono stack              | same                         |
| `.breadcrumbs > ol`         | `font-size`      | `12px`                     | same                         |
| `.breadcrumbs > ol`         | `letter-spacing` | `0.24px` (0.02em)          | same                         |
| `.breadcrumbs > ol`         | `color`          | `rgb(30,30,30)` (ink-soft) | `rgb(212,212,212)`           |
| home `<a>`                  | `color`          | `rgb(10,10,10)` (ink)      | `rgb(237,237,237)`           |
| home `<a>`                  | `border-radius`  | `4px`                      | same                         |
| separator `<li>`            | `opacity`        | `0.45`                     | same                         |
| current `<li>`              | `color`          | `rgb(10,10,10)`            | `rgb(237,237,237)`           |
| home `<a>` `:focus-visible` | `outline`        | `rgb(10,10,10) solid 1px`  | `rgb(237,237,237) solid 1px` |

The **color/font-family rows are the proof**: `color` flipping light↔dark with no
`dark:` class confirms `@theme inline` works; `font-family` = DM Mono confirms the
same-named font bridge is safe.

- [ ] **Step 4: Screenshot** the breadcrumb area in light and dark (supporting
      evidence; if it renders blank under the build, the computed-style table above is the
      authoritative gate — see the dev-preview gotcha).

- [ ] **Step 5: Stop the prod server** when done.

---

## Task 6: Push, PR, and the don't-merge-until-verified gate

- [ ] **Step 1: Push + open the PR.**

```bash
git push -u origin feat/phase3-hybrid-tailwind
gh pr create --fill --base main \
  --title "feat: phase 3 — hybrid tailwind v4 (no-preflight token bridge + breadcrumbs proof)"
```

- [ ] **Step 2: Wait for green** — GitHub Actions CI (mirrors `npm run check`) **and**
      the Vercel preview deployment `READY`. Inspect the **preview URL's** breadcrumb in
      light + dark to confirm parity on real infra (not just local).

- [ ] **Step 3: Do NOT merge** until: `npm run check` green · CI green · Vercel
      preview `READY` · computed-style proof passed local + preview. Then hand back to the
      user for the merge decision (per house protocol, merges are user-gated).

---

## Self-review (run against the spec)

- **Spec coverage:** engine (Task 2) · no-Preflight selective import (Task 3) ·
  `@theme inline` bridge incl. the `inline` correction (Task 3) · `@custom-variant
dark` (Task 3) · primary screens (Task 3) · Breadcrumbs proof incl. all mapping
  corrections — `rounded-[4px]`, `text-[0.75rem]`, `list-none m-0 p-0`, font-inherit
  (Task 4) · computed-style + dark-flip verification (Task 5) · `npm run check` + CI +
  preview gates (Tasks 5–6). ✔ every spec section maps to a task.
- **Placeholders:** none — full CSS, full JSX, exact commands/grep checks/expected
  values provided.
- **Consistency:** token utility names (`text-ink`, `text-ink-soft`, `font-mono`,
  `rounded-*`) match the `@theme inline` keys (`--color-ink`, `--color-ink-soft`,
  `--font-mono`, `--radius-*`) in Task 3. Breakpoint screens (700/900/1024) match the
  spec.
