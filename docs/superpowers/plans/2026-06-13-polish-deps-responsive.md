# Polish round (safe dep bumps + responsive spot-check) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bump three low-risk dependencies and confirm the layout holds at narrow-mobile + ultrawide (fixing only what breaks), then close out the already-done polish items in the BACKLOG.

**Architecture:** Two independent, low-risk commits on one branch. The dep bump is mechanical (exact-pinned currency). The responsive pass is verify-then-fix: measure horizontal overflow + inspect layout at the target widths against a prod build, apply CSS-only additive fixes only where something breaks.

**Tech Stack:** Next.js 15 (Pages Router), React 19, Tailwind 4, `npm run check` gate, Playwright E2E, the preview tooling.

**Spec:** `docs/superpowers/specs/2026-06-13-polish-deps-responsive-design.md`

**Branch:** `feat/polish-deps-responsive` (already created; the spec commit is on it).

**Testing note:** No unit-test runner (Playwright E2E only). Verification = `npm run check` (TypeScript/lint/build) + `npm run test:e2e` (regression guard, renders pages so it catches a broken icon/style import) + the responsive measurement pass. Consistent with the Phase 2/5 convention.

**Conventions:** commits authored `h.goretsov <gorecov4@gmail.com>`, conventional messages, no AI trailer; `npm run check` green before the PR; merge is the user's call.

---

## Task 1: Safe dependency bumps

**Files:** Modify `package.json`, `package-lock.json`.

- [ ] **Step 1: Bump the three packages (exact-pinned via `.npmrc` `save-exact`).**

```bash
npm install tailwindcss@4.3.1 @tailwindcss/postcss@4.3.1 lucide-react@1.18.0
```

Expected: `package.json` shows `"tailwindcss": "4.3.1"`, `"@tailwindcss/postcss": "4.3.1"` (devDependencies) and `"lucide-react": "1.18.0"` (dependencies) — no `^` prefixes; `package-lock.json` updated.

- [ ] **Step 2: Run the full gate.**

Run: `npm run check`
Expected: lint, format:check, typecheck, `npm audit --audit-level=high`, and build all pass.

- [ ] **Step 3: Run the E2E smoke suite** (renders every page, so it catches a broken Tailwind style or lucide icon import).

Run: `npm run test:e2e`
Expected: all 15 tests pass.

- [ ] **Step 4: Commit.**

```bash
git add package.json package-lock.json
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "build: bump tailwindcss + @tailwindcss/postcss to 4.3.1 and lucide-react to 1.18.0"
```

If the gate or E2E regresses: `git checkout package.json package-lock.json && npm install` to revert, and report which package caused it (don't force a broken bump through).

---

## Task 2: Responsive spot-check (verify → fix only what breaks)

**Files:** none unless a fix is needed; then the **offending element's existing stylesheet** (CSS-only, additive — located via the inspection in Step 2).

- [ ] **Step 1: Start the prod server** (prod build avoids the dev-StrictMode blank-screenshot gotcha; stop any preview "Next Dev" on 5170 first).

```bash
npm run build && npm run start   # serves on :3000
```

- [ ] **Step 2: Measure each page at each width.** For pages `/`, `/works`, `/works/<a-real-slug>`, `/labs`, `/contact` and widths **360, 390, 414, 2560**, use the preview tooling:
  - `preview_resize` to the width.
  - **Horizontal-overflow check (the reliable, primary signal)** via `preview_eval`:
    ```js
    ({
      w: innerWidth,
      scroll: document.documentElement.scrollWidth,
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    });
    ```
    Expected: `overflow: false` at every width. Any `true` = a horizontal-scroll bug to fix.
  - `preview_snapshot` (structure/text) + `preview_inspect` on headings/containers for cramped/overlapping/clipped text (narrow) and over-stretched line lengths (ultrawide). Try `preview_screenshot`; if blank (dev gotcha doesn't apply to prod build, but if it does) rely on the snapshot + computed-style metrics.

- [ ] **Step 3: Fix only what breaks — CSS-only, additive.** For each issue, edit the offending element's existing stylesheet with a minimal additive rule (e.g. `overflow-wrap: anywhere`, a `clamp()` font-size, a container `max-width`, a narrow-width `padding` tweak). No JSX/structural change. Re-run the Step-2 check at that width to confirm the fix. Repeat until all widths pass.

- [ ] **Step 4: Stop the server** and commit any fixes (skip if zero changes — the verification stands on its own).

```bash
lsof -ti tcp:3000 | xargs -r kill
git add -A src/
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "fix: <one-line of the responsive tweak made>"
```

---

## Task 3: BACKLOG closeout + PR

**Files:** Modify `docs/superpowers/BACKLOG.md`.

- [ ] **Step 1: Update the polish section of `docs/superpowers/BACKLOG.md`** — mark **next/image** done (no raw `<img>` left; 7 components already use `next/image`) and **below-fold lazy-load** done (`LiveTime` + `LabsCanvas` already `ssr:false`); record **`next` 15→16** and **`eslint`/`@eslint/js` 9→10** as **deferred** major-migration cycles (not polish). Note the safe bumps + responsive pass shipped via this PR.

- [ ] **Step 2: Commit.**

```bash
git add docs/superpowers/BACKLOG.md
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "docs: close out next/image + lazy-load polish; defer next 16 + eslint 10"
```

- [ ] **Step 3: Push + open the PR.**

```bash
git push -u origin feat/polish-deps-responsive
gh pr create --base main --title "chore: polish — safe dep bumps + responsive spot-check" --body "<summary: the 3 bumps; responsive widths verified + any fixes; next/image & lazy-load already done; majors deferred. Test plan: npm run check + e2e green; widths confirmed.>"
```

- [ ] **Step 4: Verify CI + Vercel green** (`gh pr checks <pr> --watch`): `check` + `e2e` pass, Vercel preview `READY`. Merge is the user's call; do not auto-merge.

---

## Self-review

- **Spec coverage:** §1 bumps → Task 1; §2 responsive → Task 2; §3 BACKLOG closeout → Task 3; verification (check + E2E + widths) → Tasks 1–2 + Task 3 Step 4. All sections covered.
- **Placeholders:** the dep versions, widths, pages, and overflow-check code are concrete. Task 2's fix paths are genuinely discovery-driven (a verify-then-fix pass) but the _approach_ is fully specified (CSS-only, additive, in the offending element's stylesheet) — and the PR body / fix-commit message are filled at execution from what's found.
- **Consistency:** versions match the spec table + `npm outdated`; branch + commit attribution match conventions.
