# Phase 2 — Health/Quality Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ESLint + Prettier + a husky/lint-staged pre-commit hook and a root `PROTOCOL.md` pre-deploy checklist to the By_Hris portfolio, with zero app-behavior change.

**Architecture:** Tooling/config only. ESLint flat config (ESLint 9) + Prettier (tuned to the existing style) enforced at commit time via husky + lint-staged; a one-command `npm run check` gate (lint + format:check + `npm audit --audit-level=high` + build); and a documented pre-deploy checklist.

**Tech Stack:** ESLint 9 (flat config), eslint-plugin-react / react-hooks / react-refresh, eslint-config-prettier, Prettier 3, husky 9, lint-staged 15, on the existing Vite 5 / React 18 project.

**Note on testing:** This phase adds tooling, not application features, and the project has no unit-test framework. "Verification" for each task is running the relevant tool/command and confirming the expected output — not TDD unit tests.

**Note vs. spec:** This plan refines the spec's 3-commit grouping into finer, sequential commits and **installs husky last** so the pre-commit hook doesn't auto-modify files during the bulk format/lint-fix commits. All spec elements are covered.

**Commit convention (every commit in this plan):** author as `h.goretsov`, no AI co-author trailer:
`git commit --author="h.goretsov <gorecov4@gmail.com>" -m "..."`

---

### Task 1: ESLint flat config + lint scripts

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json` (add `lint`, `lint:fix` scripts; devDependencies via npm)

- [ ] **Step 1: Install ESLint dev dependencies**

Run:
```bash
npm i -D eslint @eslint/js eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh globals eslint-config-prettier
```
Expected: packages added to `devDependencies`; no errors.

- [ ] **Step 2: Create `eslint.config.js`**

```js
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist', 'node_modules', 'public'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  prettier,
];
```

- [ ] **Step 3: Add lint scripts to `package.json`**

Add to the `"scripts"` block:
```json
"lint": "eslint .",
"lint:fix": "eslint . --fix"
```

- [ ] **Step 4: Run lint to capture the baseline**

Run: `npm run lint`
Expected: ESLint executes without a *config* error (it parses `eslint.config.js`). It will likely report some pre-existing findings (unused vars, hook-deps, react-refresh). Record the list — Task 2 resolves them. If instead it errors with a config/plugin-API problem (e.g. `react.configs.flat is undefined`), fix the config before continuing (check installed `eslint-plugin-react` ≥ 7.37 for flat support).

- [ ] **Step 5: Commit (config only)**

```bash
git add eslint.config.js package.json package-lock.json
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "chore: add ESLint flat config and lint scripts"
```

---

### Task 2: Resolve ESLint findings (triage)

**Files:**
- Modify: whichever `src/**/*.{js,jsx}` files Task 1 Step 4 flagged
- Possibly delete: `src/components/project/Lightbox.jsx` (dead code — see Step 3)

- [ ] **Step 1: Auto-fix the mechanical findings**

Run: `npm run lint:fix`
Then: `npm run lint`
Expected: the auto-fixable issues (e.g. unused imports) are gone; only judgment-call findings remain.

- [ ] **Step 2: Resolve remaining findings with fix-or-annotate**

For each remaining finding, apply the matching rule (no blanket rule-disabling):
- `no-unused-vars` (real unused var/param) → remove it, or prefix an intentionally-unused arg with `_`.
- `react-hooks/exhaustive-deps` → add the missing dependency if safe; if adding it would change behavior, leave the code as-is and annotate the line:
  ```js
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once on mount
  ```
- `react-refresh/only-export-components` (a file exports a component **and** a non-component) → if trivial, move the non-component export to its own module; otherwise leave the `warn` as-is (it does not fail `eslint .`).

Re-run `npm run lint` after edits.

- [ ] **Step 3: Decide on dead `Lightbox.jsx`**

`src/components/project/Lightbox.jsx` is imported nowhere (confirmed in HANDOVER.md). Recommended: delete it — this also closes a standing backlog item.

**Gate:** confirm with the user before deleting. If approved:
```bash
git rm src/components/project/Lightbox.jsx
```
If the user wants to keep it, instead resolve any lint findings inside it per Step 2.

- [ ] **Step 4: Verify lint is clean and build still works**

Run: `npm run lint`
Expected: exit code 0 (warnings allowed, no errors).
Run: `npm run build`
Expected: clean build, ~2199 modules, no errors. (Deleting `Lightbox.jsx` does
**not** change the module count — it is imported nowhere, so it was never in the
bundle graph.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "fix: resolve ESLint findings"
```
(If no source changes were needed, skip this commit.)

---

### Task 3: Prettier config + format scripts

**Files:**
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Modify: `package.json` (add `format`, `format:check` scripts; devDependency)

- [ ] **Step 1: Install Prettier**

Run: `npm i -D prettier`
Expected: `prettier` added to `devDependencies`.

- [ ] **Step 2: Create `.prettierrc.json`**

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "printWidth": 80,
  "trailingComma": "all"
}
```

- [ ] **Step 3: Create `.prettierignore`**

```
dist
node_modules
package-lock.json
public/*.html
public/_headers
public/_redirects
```

- [ ] **Step 4: Add format scripts to `package.json`**

Add to `"scripts"`:
```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

- [ ] **Step 5: Confirm Prettier sees drift (don't write yet)**

Run: `npm run format:check`
Expected: exits non-zero, listing many files as "Code style issues found" / "would be reformatted". This is expected — Task 4 performs the one-time format.

- [ ] **Step 6: Commit (config only, no formatting yet)**

```bash
git add .prettierrc.json .prettierignore package.json package-lock.json
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "chore: add Prettier config and format scripts"
```

---

### Task 4: One-time format pass

**Files:**
- Modify: all Prettier-eligible files (mechanical reformat)

- [ ] **Step 1: Format the codebase**

Run: `npm run format`
Expected: Prettier rewrites eligible files; prints the formatted file list.

- [ ] **Step 2: Verify formatting, lint, and build all pass**

Run: `npm run format:check`
Expected: "All matched files use Prettier code style!" (exit 0).
Run: `npm run lint`
Expected: exit 0 (eslint-config-prettier means formatting changes introduce no lint conflicts).
Run: `npm run build`
Expected: clean build, no errors.

- [ ] **Step 3: Sanity-check the diff is formatting-only**

Run: `git diff --stat`
Expected: many files touched, but spot-checking `git diff` shows only whitespace/quote/comma changes — no logic changes. Confirm `public/*.html` (CV/Résumé) are **untouched**.

- [ ] **Step 4: Commit (isolated format commit)**

```bash
git add -A
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "style: format codebase with Prettier"
```

---

### Task 5: husky + lint-staged pre-commit hook

**Files:**
- Create: `.husky/pre-commit`
- Modify: `package.json` (`prepare` script + `lint-staged` block; devDependencies)

- [ ] **Step 1: Install husky + lint-staged**

Run: `npm i -D husky lint-staged`
Expected: both added to `devDependencies`.

- [ ] **Step 2: Initialize husky**

Run: `npx husky init`
Expected: creates `.husky/pre-commit` (default content `npm test`) and adds `"prepare": "husky"` to `package.json` scripts.

- [ ] **Step 3: Set the hook to run lint-staged**

Overwrite `.husky/pre-commit` with exactly:
```sh
npx lint-staged
```

- [ ] **Step 4: Add the `lint-staged` block to `package.json`**

Add at the top level of `package.json` (sibling of `"scripts"`):
```json
"lint-staged": {
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,css,md}": ["prettier --write"]
}
```

- [ ] **Step 5: Test the hook auto-fixes a staged change**

Create a temporary, deliberately mis-formatted file:
```bash
printf 'const   x=1\nexport default x\n' > src/__hooktest.js
git add src/__hooktest.js
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "test: verify pre-commit hook"
```
Expected: the commit triggers `lint-staged`; `eslint --fix` + `prettier --write` reformat the file (to `const x = 1;` etc.) before the commit lands. Verify:
```bash
git show HEAD:src/__hooktest.js
```
Expected: shows the *formatted* content, proving the hook ran.

- [ ] **Step 6: Remove the test file and amend it out**

```bash
git rm src/__hooktest.js
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "chore: add husky + lint-staged pre-commit hook"
```
(This commit removes the test file; the prior test commit + this one net to just the hook setup. Alternatively `git reset --soft HEAD~1 && git rm` to collapse — either is fine.)

- [ ] **Step 7: Confirm `.husky/` and config are committed**

Run: `git status --short`
Expected: clean tree. `.husky/pre-commit`, the `prepare` script, and the `lint-staged` block are committed.

---

### Task 6: `check` gate + PROTOCOL.md

**Files:**
- Modify: `package.json` (add `check` script)
- Create: `PROTOCOL.md` (repo root)

- [ ] **Step 1: Add the `check` script to `package.json`**

Add to `"scripts"`:
```json
"check": "npm run lint && npm run format:check && npm audit --audit-level=high && npm run build"
```

- [ ] **Step 2: Create root `PROTOCOL.md`**

```markdown
# By_Hris Designs — Pre-Deploy Health & Quality Protocol

Run before every deploy. The first three are automated via `npm run check`.

## Automated gate — `npm run check`
1. **Lint** — `npm run lint` exits clean (no errors).
2. **Format** — `npm run format:check` reports all files styled.
3. **Audit** — `npm audit --audit-level=high` finds no high/critical.
   - _Known/accepted:_ 2 moderate (esbuild via Vite), dev-server only, not in
     the deployed static build. They sit below the `high` gate by design.
4. **Build** — `npm run build` completes with no errors/warnings.

## Manual checks
5. **Console-clean** — open the build preview; 0 warnings/errors in the browser
   console on each route (`/`, `/works`, `/about`, `/labs`, `/contact`, a
   `/projects/:slug`, and an unknown path for 404).
6. **Titles / meta / links** — per-route `document.title` updates on navigation;
   Open Graph / Twitter / canonical meta present; no broken internal links.
7. **Lighthouse** (Chrome DevTools, incognito) — Performance / Accessibility /
   Best Practices / SEO all pass at the target threshold.
8. **Animation check** — verify framer-motion crossfades via
   `npm run build && npm run preview`, **not** `npm run dev` (React StrictMode
   breaks AnimatePresence exit animations in dev).

## Pre-commit (automatic)
A husky + lint-staged pre-commit hook runs `eslint --fix` + `prettier --write`
on staged files, so most issues are fixed before they ever land.
```

- [ ] **Step 3: Run the full gate**

Run: `npm run check`
Expected: lint clean → format:check clean → audit finds no high/critical (the 2 moderates do not fail it) → build clean. Overall exit 0.

- [ ] **Step 4: Commit**

```bash
git add package.json PROTOCOL.md
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "chore: add check gate and PROTOCOL.md"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full gate passes from clean**

Run: `npm run check`
Expected: exit 0, all four gates pass in sequence.

- [ ] **Step 2: Hook is live**

Run: `git config core.hooksPath` (expected: `.husky/_` or husky-managed) and confirm `.husky/pre-commit` exists.

- [ ] **Step 3: Review the commit series**

Run: `git log --oneline -8`
Expected (newest first): check+PROTOCOL, husky+lint-staged, style:format, fix:ESLint (if any), chore:Prettier, chore:ESLint, then the prior `docs:` spec commit.

- [ ] **Step 4: Push (optional — confirm with user)**

```bash
git push origin main
```
Pushes the whole Phase 2 set (spec + implementation). Confirm with the user first; a linked Vercel project will redeploy.

---

## Definition of Done
- `npm run check` exits 0 (lint + format + audit-high + build).
- Pre-commit hook auto-formats staged files (verified in Task 5).
- `PROTOCOL.md` exists at repo root with the full checklist.
- No application behavior, feature, or visual change.
- Commits authored as `h.goretsov`, no AI co-author trailer.
