# Phase 2 — Health / Quality Protocol — Design Spec

- **Date:** 2026-06-03
- **Status:** Design approved → pending implementation plan
- **Project:** By_Hris Designs portfolio (React 18.3 + Vite 5, react-router-dom 6)
- **Backlog item:** `HANDOVER.md` §B "Phase 2"

## Context

The project has no linting, formatting, or pre-deploy quality gate today — only
`dev` / `build` / `preview` scripts. The code is hand-formatted and consistent
but unenforced. This phase adds automated linting + formatting, a pre-commit
gate, and a documented pre-deploy checklist, **without changing any
application/runtime behavior**.

## Goals

- Catch quality issues (lint errors, formatting drift, console noise) before
  commit and before deploy.
- Add ESLint + Prettier configured to the project's existing conventions.
- Enforce automatically at commit time via a pre-commit hook.
- Provide a single documented pre-deploy checklist (`PROTOCOL.md`, repo root).
- Provide one-command local verification (`npm run check`).

## Non-goals (this phase)

- No CI / GitHub Actions (deferred; can layer on later).
- No test suite (none exists; out of scope).
- No dependency major-version upgrades (React 19 / react-router 7 / Vite 8 stay
  held back).
- No app behavior, feature, or visual-design changes.
- The known **2 moderate `npm audit` advisories** (esbuild via Vite, dev-server
  only) are documented as *accepted*, not fixed — the only fix is a breaking
  Vite major.

## Decisions

1. **Enforcement depth: tooling + checklist doc + pre-commit hook** (husky +
   lint-staged). No CI this phase. Rationale: a solo project benefits from
   automatic enforcement without CI overhead.
2. **Prettier on existing code: match-style, format once.** Prettier is tuned to
   the observed style; a single isolated "format all" commit normalizes the
   tree. Large one-time diff, zero behavior change.
3. **ESLint flat config** (`eslint.config.js`, ESLint 9) — the current standard
   and Vite's React-template default; not legacy `.eslintrc`.

## Design

### ESLint

- `eslint.config.js` (flat). Composes, in order: `@eslint/js` recommended,
  `eslint-plugin-react` (React 18, JSX), `eslint-plugin-react-hooks`
  recommended, `eslint-plugin-react-refresh` (Vite HMR safety), `globals.browser`,
  and **`eslint-config-prettier` last** to disable formatting-related rules
  (Prettier owns formatting).
- Lint scope: `src/**/*.{js,jsx}`. Ignores: `dist`, `node_modules`, `public/**`
  (hand-authored HTML), and generated files.
- Dev deps: `eslint`, `@eslint/js`, `eslint-plugin-react`,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals`,
  `eslint-config-prettier`.

### Prettier

Style confirmed against `src/` (100 single-quote imports vs 4 double;
`src/data/projects.js` uses trailing commas in multiline structures):

- `.prettierrc.json`:
  `{ "singleQuote": true, "semi": true, "tabWidth": 2, "printWidth": 80, "trailingComma": "all" }`
- `.prettierignore`: `dist`, `node_modules`, `package-lock.json`,
  **`public/*.html`** (self-contained CV/Résumé — must not be reformatted),
  `public/_headers`, `public/_redirects` (non-standard formats).
- Dev dep: `prettier`.

### npm scripts

- `"lint": "eslint ."`
- `"lint:fix": "eslint . --fix"`
- `"format": "prettier --write ."`
- `"format:check": "prettier --check ."`
- `"check": "npm run lint && npm run format:check && npm audit --audit-level=high && npm run build"`
  — the local pre-deploy gate. `--audit-level=high` so it fails on high/critical
  only; the 2 known/accepted moderate (dev-only) advisories do **not** block it
  (a bare `npm audit` would fail the gate on every run because of them).
- `"prepare": "husky"` — installs the hook on `npm install`.

### Pre-commit hook (husky + lint-staged)

- `husky` v9 → `.husky/pre-commit` runs `npx lint-staged`.
- `lint-staged` config (in `package.json`):
  - `"*.{js,jsx}": ["eslint --fix", "prettier --write"]`
  - `"*.{json,css,md}": ["prettier --write"]`
- Dev deps: `husky`, `lint-staged`. `.husky/` is committed; the `prepare` script
  wires it up on fresh clones.

### PROTOCOL.md (pre-deploy checklist, repo root)

1. `npm run build` — clean, no errors/warnings.
2. `npm run lint` — clean.
3. `npm run format:check` — clean.
4. `npm audit` — high/critical must be zero; the `check` gate enforces this via
   `--audit-level=high`. **Known/accepted:** 2 moderate (esbuild via Vite),
   dev-server only, not present in the deployed static build (they sit below the
   high gate).
5. Console-clean — 0 warnings/errors in the browser console on each route.
6. Links / per-route `document.title` / meta tags present and correct.
7. Lighthouse (Chrome DevTools) — performance / a11y / best-practices / SEO pass.
8. Animation/crossfade check via `npm run build && npm run preview` — **not**
   `npm run dev` (StrictMode breaks framer-motion AnimatePresence exits).

## New / changed files

- **New:** `eslint.config.js`, `.prettierrc.json`, `.prettierignore`,
  `.husky/pre-commit`, `PROTOCOL.md` (repo root), and this spec.
- **Changed:** `package.json` (scripts, `lint-staged` block, dev deps),
  `package-lock.json`.
- **Possibly changed:** a handful of `src/**` files from lint triage and the
  format-once pass.

## Lint triage

The first `eslint .` run will surface pre-existing issues. Approach:

- Auto-fixable → `eslint . --fix`.
- Real warnings (e.g. `react-hooks/exhaustive-deps`) → fix if safe, else annotate
  with an explanatory `// eslint-disable-next-line <rule>` rather than broadening
  config.
- Dead `src/components/project/Lightbox.jsx` (imported nowhere): if flagged,
  remove it — closes a separate backlog item. **Confirm with user before
  deleting.**
- Target: `npm run lint` exits clean with **no blanket rule-disabling**.

## Commit strategy

1. `chore: add ESLint, Prettier, husky, lint-staged, and PROTOCOL.md` — all
   config/tooling/doc, no formatting churn.
2. `style: format codebase with Prettier` — the isolated format-once pass
   (mechanical, no logic change).
3. `fix: resolve ESLint findings` — only if triage requires code changes; small
   and individually reviewed.

All commits authored as `h.goretsov`, no AI co-author trailer (per project
convention).

## Risks

- Format-once produces a large diff — mitigated by isolating it in its own
  commit.
- ESLint may flag many pre-existing issues — mitigated by the fix-or-annotate
  triage (no blanket disables).
- husky requires git (present) and the `prepare` script to have run — verified on
  `npm install`.

## Verification

- `npm run lint` → clean.
- `npm run format:check` → clean.
- `npm run build` → clean (2199-module baseline).
- Stage a deliberately mis-formatted change → confirm the pre-commit hook
  auto-fixes it before the commit lands.
- `npm run check` → all four gates (lint, format, audit, build) pass in sequence.
