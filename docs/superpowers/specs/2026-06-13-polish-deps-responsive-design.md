# Polish round — safe dep bumps + responsive spot-check — Design Spec

**Date:** 2026-06-13 · **Status:** approved (brainstorm) · **Roadmap:** `docs/superpowers/BACKLOG.md` → deferred polish / tech-debt items.

## Context — what's actually left

Exploring the four deferred polish items showed the BACKLOG notes are stale:

- **next/image — already DONE.** No raw `<img>` JSX remains; 7 components import `next/image` (`ProjectCard`, `SlideShow`, `ScrollViewport`, `ScreenSwitcher`, `AnnotatedImage`, `works.tsx`, `works/[slug].tsx`). The "11 `<img>`" note predates that migration. → close in BACKLOG, no work.
- **Below-fold lazy-load — already DONE.** The two heaviest client-only pieces are `ssr:false` dynamic imports: `LiveTime` (Header) and `LabsCanvas` (the xyflow canvas). Nothing else is heavy enough to defer. → close in BACKLOG, no work.
- **Dependency bumps** — `npm outdated` splits into **safe** (this round) and **risky majors** (deferred).
- **Responsive spot-check** — real; a verify-then-fix pass.

This round = the safe bumps + the responsive spot-check + the BACKLOG closeout, as **one PR** (`feat/polish-deps-responsive`) with separate commits.

## 1. Safe dependency bumps

Bump to the latest, exact-pinned (no `^`, per `.npmrc`):

| Package                | From   | To     | Kind  |
| ---------------------- | ------ | ------ | ----- |
| `tailwindcss`          | 4.3.0  | 4.3.1  | patch |
| `@tailwindcss/postcss` | 4.3.0  | 4.3.1  | patch |
| `lucide-react`         | 1.17.0 | 1.18.0 | minor |

Verify with `npm run check` (lint · format · typecheck · audit-high · build) + `npm run test:e2e`. Pure currency; if anything regresses, revert the bump (no app-code change rides along).

## 2. Responsive spot-check (verify → fix only what breaks)

- **Pages:** `/`, `/works`, `/works/[slug]` (a case study), `/labs`, `/contact`.
- **Widths:** narrow mobile **360 / 390 / 414px**; **ultrawide ~2560px**.
- **Method:** against `npm run build && npm run start` (the prod build sidesteps the dev-StrictMode blank-screenshot gotcha). Use the preview tooling's resize + DOM/computed-style inspection (reliable text-based checks) and screenshots where they render; fall back to `preview_inspect`/`preview_snapshot` per the project's "verify via build + inspect" rule.
- **Acceptance:** no horizontal overflow and no cramped/overlapping/clipped text at narrow widths; no over-stretched content or unreadably-long lines at ultrawide (existing `max-width` containers should already cap most of it).
- **Fixes:** **CSS-only and additive** — a `clamp()` on a font-size, a container `max-width`, a narrow-width spacing tweak. **No JSX/structural changes.** If the pass finds nothing, the responsive item ships as a verification note with **zero code**.

## 3. BACKLOG closeout (doc)

Mark next/image + below-fold lazy-load **done** (already satisfied); record `next` 15→16 and `eslint`/`@eslint/js` 9→10 as **deferred** — framework/tooling majors that each warrant their own migration cycle (Next 16 interacts with Sentry + BotID), not polish.

## Verification

`npm run check` green; `npm run test:e2e` green; the five pages visually confirmed at the listed widths; PR + CI (`check` + `e2e`) + Vercel preview green. Merge is the user's call.

## Out of scope (YAGNI)

`next` 16, `eslint`/`@eslint/js` 10, structural layout changes, net-new breakpoints beyond what a found fix requires, design/visual redesign.

## Self-review

- **Placeholders:** none — exact versions + widths + pages listed.
- **Consistency:** the three packages match `npm outdated`'s "Latest"; the deferred majors match the approved scope.
- **Scope:** small + focused; one PR, one plan. The responsive fixes are intentionally open-ended (verify-then-fix) but bounded to CSS-only.
