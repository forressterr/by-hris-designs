# Phase 3 — Hybrid Tailwind v4 — Design

**Status:** approved 2026-06-11 · **Phase:** 3 of the rework roadmap (`docs/superpowers/BACKLOG.md`)

## Goal & context

Make **Tailwind v4 utilities available for new code** without changing how a single
pixel of the existing site looks, works, or feels. Styling today is one **3,741-line
`src/styles/index.css`** (global BEM-ish classes + CSS-custom-property design tokens
in `:root`, imported once in `src/pages/_app.tsx`). Dark mode is done with ~20
scattered `[data-theme='dark']` overrides of the neutral tokens; there are 11
irregular breakpoints and 0 `@font-face` (DM Sans/DM Mono load via a Google Fonts
`<link>` in `_document.tsx`).

A literal 1:1 rewrite of all 30 components to utilities is large and **high-risk for
low user-visible payoff** under a "no visual change" constraint — those irregular
breakpoints and scattered dark-mode rules are exactly where a full rewrite silently
breaks parity. So Phase 3 is the **Hybrid** approach (user-chosen 2026-06-10): wire
Tailwind in alongside `index.css`, bridge it to the existing tokens, and **prove the
bridge on ONE component**. Everything else stays on `index.css` and migrates
organically when next touched.

## Locked decisions (from BACKLOG + this confirmation)

- **Engine:** Tailwind **v4** via `@tailwindcss/postcss` (exact-pinned devDeps) +
  a `postcss.config.mjs`. **CSS-first config — no `tailwind.config.js`.**
- **No Preflight (the zero-visual-change crux):** do **not** `@import "tailwindcss"`
  (it ships Preflight, a reset that would restyle headings/lists/buttons/etc.).
  Import the layers selectively at the top of `index.css` instead:
  `@layer theme, base, components, utilities;` +
  `@import 'tailwindcss/theme.css' layer(theme);` +
  `@import 'tailwindcss/utilities.css' layer(utilities);`. **`preflight.css` is
  deliberately omitted.** Utilities are JIT, so unused utilities emit no CSS →
  adding the engine with no utilities in the markup changes nothing on screen.
- **Token bridge via `@theme inline` (CORRECTION to the BACKLOG draft):** map the
  existing `:root` vars into Tailwind's theme namespace. **Must be `@theme inline`,
  not plain `@theme`.** Plain `@theme { --color-ink: var(--ink) }` emits
  `--color-ink: var(--ink)` resolved once at `:root` (light) → color utilities would
  **freeze to the light palette and not flip in dark mode**. `@theme inline` inlines
  the value so the generated utility is `.text-ink { color: var(--ink) }`, resolved
  at the **use-site** → flips automatically inside `[data-theme='dark']`, with **no
  `dark:` variant needed for color**. This is the load-bearing detail the proof
  validates.
- **`@custom-variant dark`** registered for the rare _explicit_ dark case:
  `@custom-variant dark (&:where([data-theme='dark'] *));`. (Colors don't need it —
  the token flip handles them. Registered for completeness/new code.)
- **Screens:** register the site's three **primary** breakpoints as `@theme` screens
  for NEW responsive utilities — `--breakpoint-sm: 700px; --breakpoint-md: 900px;
--breakpoint-lg: 1024px;`. This overrides Tailwind's defaults (640/768/1024) so the
  codebase keeps **one** breakpoint vocabulary aligned with the site's primaries.
  Documented in `index.css`; **zero effect until a responsive utility is used** (the
  proof uses none). The other 8 irregular breakpoints stay only as raw media queries
  in `index.css` — not replicated.
- **Proof component = `Breadcrumbs` (CORRECTION to the BACKLOG draft).** The draft
  offered "Breadcrumbs _or_ the Logo wrapper"; `Logo.tsx` turns out to be a single
  `fill="currentColor"` SVG sized by props with **no migratable CSS classes**, so it
  proves nothing. `Breadcrumbs` is the ideal validator: it exercises the
  dark-flipping color tokens (`--ink`, `--ink-soft`), the mono font token, layout
  (flex/gap/align), spacing, a non-token radius, opacity, and hover + focus-visible
  states; its CSS is one self-contained block ([index.css:365](../../../src/styles/index.css)) and its
  BEM classes are referenced only in `Breadcrumbs.tsx` (grep-verified) → migrating it
  touches nothing else.
- **Out of scope (YAGNI):** rewriting the other 29 components; deleting/!restructuring
  `index.css`; replicating all 11 breakpoints; `prettier-plugin-tailwindcss` class
  sorting; **any visual change**.

## The token bridge (exact)

Added at the **very top** of `src/styles/index.css`, before the existing reset
(CSS requires `@import` to precede style rules; the bare `@layer` order statement is
allowed first):

```css
/* Tailwind v4 — utilities only, NO Preflight (see Phase 3 design doc). */
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities);

/* Bridge Tailwind's theme to the existing :root design tokens. `inline` is
   REQUIRED so color utilities resolve var(--token) at the use-site and flip in
   dark mode (the [data-theme='dark'] overrides below re-point --ink etc.). */
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

@custom-variant dark (&:where([data-theme='dark'] *));
```

**Naming-collision note (verify in the proof):** the color keys use distinct names
(`--color-ink` vs the site's `--ink`) → no collision, rock-solid. The **font and
radius** keys share names with the site tokens (`--font-mono` ≡ `--font-mono`,
`--radius-sm` ≡ `--radius-sm`). `@theme inline` is what makes this safe: it does
**not** emit those keys back into `:root`, so the only `--font-mono`/`--radius-sm` in
the output stays the site's, and the generated utilities reference it. The proof
verifies the breadcrumb's computed `font-family` resolves to the DM Mono stack. **If
the build rejects the same-named inline refs**, the documented fallback is to drop
the font/radius bridge lines and use arbitrary utilities
(`font-[family-name:var(--font-mono)]`) — colors (the real deliverable) are
unaffected either way.

## Proof: migrate `Breadcrumbs` to utilities

Rewrite `src/components/Breadcrumbs.tsx` className strings to Tailwind utilities and
**delete the `.breadcrumbs*` block from `index.css`** (lines ~359–446). Net computed
styles must be **pixel-identical** in light AND dark. Exact per-element utility
strings (1:1 with the deleted CSS) are spelled out in the plan; the mapping uses
arbitrary values wherever a Tailwind scale value would differ from the original:

- `rounded-[4px]` — **not** `rounded-sm`: the bridge re-points `--radius-sm` to the
  site's 8px, so `rounded-sm` would be 8px. The breadcrumb's 4px isn't a site token.
- `text-[0.75rem]` — **not** `text-xs`: `text-xs` also sets a paired `line-height`
  (≈1rem); the original sets font-size only and inherits `line-height: 1.5` from
  body. Arbitrary font-size sets no line-height → inheritance preserved.
- `opacity-[0.45]` / `opacity-[0.6]`, `tracking-[0.02em]` / `tracking-[0.15em]`,
  `outline-[1px_solid_var(--ink)]`, `outline-offset-[2px]`,
  `transition-[opacity_180ms_ease]` — exact arbitrary equivalents of the original
  declarations (avoids any scale rounding).
- `text-ink` / `text-ink-soft` / `font-mono` — the bridged token utilities; these are
  what the dark-mode flip + font collision are proving.

## Verification (per the dev-preview gotchas)

Screenshots can be blank under React StrictMode + AnimatePresence in `npm run dev`,
so verify against the **production build**: `npm run build && npm run start` (stop any
desktop-preview `next dev` first — it shares `.next/` and clobbers `next start`).

1. **`npm run check` green** — lint · format:check · typecheck · `npm audit
--audit-level=high` · `next build`. (The new `postcss.config.mjs` is JS, outside
   tsc; prettier formats the CSS additions.)
2. **Computed-style equality (the pixel proof, screenshot-gotcha-proof):** with the
   prod build running, `preview_inspect` the migrated `.breadcrumbs` `<nav>` and its
   children on a top-level route (`/about`) **and** a deep route (`/projects/<slug>`,
   to exercise the `…` back-button), in **light and dark**. Every computed property
   must equal the documented original values — notably `color`/`font-family` flipping
   between `rgb(10,10,10)`↔`rgb(237,237,237)` light↔dark, `font-family` = DM Mono on
   the list, `gap` 8px, `padding` 24/0/12, radius 4px, the focus-visible outline.
3. **A screenshot** in each theme if it renders (supporting evidence, not the gate).

## Acceptance

- Zero visual change across every route × light/dark/breakpoints (computed-style proof
  on Breadcrumbs + a build that emits no Preflight reset and no utility CSS for
  un-migrated markup).
- The proof component's migrated computed styles match the original CSS values in both
  themes; dark-mode color flip works **without** a `dark:` variant.
- `npm run check` green; CI green; Vercel preview `READY`.
- Tailwind utilities (colors/fonts/radii/spacing/layout + the 3 primary screens)
  available for new code. No test framework (that's Phase 5).

## Conventions

Branch + PR; commits authored `h.goretsov <gorecov4@gmail.com>`, conventional
messages, no AI trailer; tidy-first (engine setup is structural; the Breadcrumbs
migration is behavioral-equivalent but a separate concern → separate commits).
`npm run check` is the gate before the PR; **don't merge until** check + CI + Vercel
preview are all green and the computed-style proof passes.
