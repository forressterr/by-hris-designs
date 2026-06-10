# House-Rules + Ground-Floor Baseline (pre-Phase-2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install the `house-rules` Claude Code skill library + make this repo its own plugin marketplace, and adopt `ground-floor`'s baseline procedures (adapted to this repo's npm + ESLint + Prettier stack) — raising codebase quality before Phase 2.

**Architecture:** Three independent strands: (1) repo-level tooling/config adoption from `ground-floor` (editor/git baseline, commitlint, husky hooks, exact pins, CI mirroring `npm run check`, tsconfig strictness); (2) Claude Code plugin infrastructure (`.claude-plugin/marketplace.json` + a local `byhris-conventions` plugin + committed `.claude/settings.json` enabling `house-rules` and the project plugin); (3) an evidence-based quality pass of `src/` against the 52 house-rules skills. All on one branch, conventional commits per concern, `npm run check` gate, PR, CI + Vercel preview verification before merge.

**Tech Stack:** Next.js 15 (Pages Router), React 19, TypeScript strict, npm, ESLint v9 + Prettier, husky + lint-staged, commitlint, GitHub Actions, Claude Code plugins.

**Sources:** clones at `/tmp/house-rules` and `/tmp/ground-floor` (github.com/iliyanyotov/{house-rules,ground-floor}).

**Deliberate adaptations (decided in scoping — do not re-litigate during execution):**

| ground-floor item                                                                                                               | Decision                | Why                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Biome (format+lint)                                                                                                             | **Skip**                | Repo standardized on ESLint v9 + Prettier in the dev-tooling phase; swapping is churn with no quality delta.                                                 |
| Bun runtime/PM/test                                                                                                             | **Skip**                | Repo is npm; Vercel build is npm; no tests yet (Phase 5).                                                                                                    |
| `bunfig minimumReleaseAge` (14-day gate)                                                                                        | **Skip + document**     | npm has no equivalent; mitigated by exact pins + committed lockfile + `npm audit` gate in `check`/CI.                                                        |
| `commit-and-tag-version` + `.versionrc.json`                                                                                    | **Skip**                | No release/changelog flow for a deployed portfolio (YAGNI).                                                                                                  |
| `tsconfig noPropertyAccessFromIndexSignature`                                                                                   | **Skip for now**        | 48 errors, concentrated in `caseStudy: Record<string, any>` access — that type is scheduled for retirement in Phase 4 (Sanity TypeGen); adopt the flag then. |
| Everything else (editorconfig, gitattributes, commitlint, hooks, exact pins, CI, .vscode, .env.example, remaining strict flags) | **Adopt (npm-adapted)** | Direct quality/procedure value.                                                                                                                              |

---

### Task 1: Branch

- [x] **Step 1:** `git checkout -b chore/house-rules-ground-floor-baseline` (from `main` @ `445785c`, clean tree). Expected: new branch.

### Task 2: Editor/git baseline

**Files:** Create `.editorconfig`, `.gitattributes`, `.vscode/settings.json`, `.vscode/extensions.json` · Modify `.gitignore` · Delete stale `dist/` from disk (untracked Vite leftover).

- [ ] **Step 1:** `.editorconfig` — copy ground-floor verbatim (utf-8, 2-space, lf, final newline, trim trailing ws except `*.md`).
- [ ] **Step 2:** `.gitattributes`:

```
*.js eol=lf
*.jsx eol=lf
*.ts eol=lf
*.tsx eol=lf
*.json eol=lf
*.mjs eol=lf
*.css eol=lf
*.md eol=lf
```

- [ ] **Step 3:** `.gitignore` — remove dead Vite entries (`dist`, `dist-ssr`, `.vite`) and the `.vscode` ignore (we now commit it); replace `.env`/`.env.local` lines with `.env*` + `!.env.example`. `rm -rf dist tsconfig.tsbuildinfo` (untracked build leftovers).
- [ ] **Step 4:** `.vscode/settings.json` — ground-floor's, adapted to Prettier/ESLint: `editor.defaultFormatter: esbenp.prettier-vscode`, `formatOnSave: true`, `codeActionsOnSave: {"source.fixAll.eslint": "explicit"}`, per-language formatter for ts/tsx/js/jsx/json/css/md, `search.exclude` for `node_modules/.next/*.tsbuildinfo`, `files.associations .env*: dotenv`, `typescript.tsdk: node_modules/typescript/lib`. `.vscode/extensions.json` recommendations: `esbenp.prettier-vscode`, `dbaeumer.vscode-eslint`, `editorconfig.editorconfig`, `mikestead.dotenv`.
- [ ] **Step 5:** Verify: `npx prettier --check .editorconfig .gitattributes .vscode/*.json` clean (or formatted); `git status` shows only intended files. Commit: `chore: adopt ground-floor editor/git baseline (editorconfig, gitattributes, vscode)`

### Task 3: Conventional commits + stronger husky hooks

**Files:** Create `commitlint.config.js`, `.husky/commit-msg`, `.husky/post-merge`, `.husky/post-checkout` · Modify `.husky/pre-commit`, `package.json` (devDeps).

- [ ] **Step 1:** `npm i -D -E @commitlint/cli @commitlint/config-conventional` (exact).
- [ ] **Step 2:** `commitlint.config.js`: `export default { extends: ['@commitlint/config-conventional'] };`
- [ ] **Step 3:** `.husky/commit-msg`: `npx --no-install commitlint --edit "$1"`. `.husky/post-merge`/`.husky/post-checkout`: ground-floor's, with `bun.lock`→`package-lock.json`, `bun install`→`npm install`. `.husky/pre-commit`: `npx lint-staged && npm run typecheck`.
- [ ] **Step 4:** Test-first: `echo "bad message" | npx commitlint` → expect FAIL (subject-empty/type-empty); `echo "chore: good message" | npx commitlint` → expect PASS.
- [ ] **Step 5:** Commit (hook proves itself): `chore: enforce conventional commits and dependency-sync git hooks`

### Task 4: npm install hygiene

**Files:** Create `.npmrc`, `.env.example` · Modify `package.json` (exact pins + engines).

- [ ] **Step 1:** `.npmrc`: `save-exact=true`.
- [ ] **Step 2:** Pin every dep/devDep to the installed version from `package-lock.json` (`node -e` script reading `packages["node_modules/<name>"].version`), add `"engines": { "node": ">=24" }`. Run `npm install` → lockfile stable; `git diff package-lock.json` minimal.
- [ ] **Step 3:** `.env.example` — header comment documenting the convention (each consumed env var gets a line; Phase 2 adds Upstash/BotID vars).
- [ ] **Step 4:** Verify `npm run check` passes. Commit: `chore: pin dependencies to exact versions and document env convention`

### Task 5: CI mirroring the local gate

**Files:** Create `.github/workflows/ci.yml`.

- [ ] **Step 1:** Workflow on `pull_request` + `push: branches: [main]`; concurrency cancel-in-progress; `permissions: contents: read`; job timeout 10m; `actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10` (v6), `actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e` (v6, `node-version: 24`, `cache: npm`); `npm ci`; then the five `check` gates as separate steps: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm audit --audit-level=high`, `npm run build` (env `NEXT_TELEMETRY_DISABLED: 1`).
- [ ] **Step 2:** `npx prettier --check .github/workflows/ci.yml`. Commit: `ci: run the npm run check gates on pushes and pull requests`. (Verified live in Task 10 via the PR.)

### Task 6: tsconfig strictness + fixes

**Files:** Modify `tsconfig.json` + the 7 source files below.

- [ ] **Step 1 (failing test):** add flags `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `useUnknownInCatchVariables`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` → `npm run typecheck` shows exactly the 40 known errors: `LabsCanvas.tsx` (20), `LightPullString.tsx` (6), `LabsCover.tsx` (5), `Breadcrumbs.tsx` (4), `ErrorBoundary.tsx` (2 × TS4114 `override`), `NavLink.tsx` (1), `lib/theme.ts` (1).
- [ ] **Step 2 (fix recipes, no behavior change):** TS4114 → add `override` keyword. Indexed-access `undefined` (TS18048/TS2532/TS2345/TS2538/TS2322) → prefer, in order: (a) hoist `const x = arr[i]; if (!x) continue/return;` guards in loops, (b) `??` fallback where a neutral default is provably equivalent, (c) length-checked destructuring for first/last. **No bare `!` assertions** unless the index is loop-bounded by the same array's length, and no logic changes — canvas math must render identically.
- [ ] **Step 3:** `npm run typecheck` → 0 errors; `npm run build` green. Commit: `refactor: satisfy stricter tsconfig flags across labs canvas and nav components`

### Task 7: Claude Code marketplace + project plugin

**Files:** Create `.claude-plugin/marketplace.json`, `plugins/byhris-conventions/.claude-plugin/plugin.json`, `plugins/byhris-conventions/skills/{byhris-house-protocol,byhris-ssr-gotchas,byhris-content-and-media}/SKILL.md`, `.claude/settings.json`.

- [ ] **Step 1:** `marketplace.json`: name `by-hris-designs`, owner `h.goretsov <gorecov4@gmail.com>`, one plugin entry `byhris-conventions` with `"source": "./plugins/byhris-conventions"`.
- [ ] **Step 2:** `plugin.json`: name `byhris-conventions`, version `0.1.0`, description "Project conventions for By_Hris Designs: house protocol, SSR gotchas, content & media rules."
- [ ] **Step 3:** Three skills (trigger-only descriptions per house-rules `SKILL_TEMPLATE.md`; bodies are the project rules already established in BACKLOG/PROTOCOL/handoff):
  - `byhris-house-protocol` — triggers: starting any feature/phase/fix/PR; about to commit/push/merge. Rules: superpowers cycle per phase; specs/plans under `docs/superpowers/`; branch+PR; `npm run check` gate; conventional commits authored `h.goretsov <gorecov4@gmail.com>`, no AI co-author trailer; don't merge until verified (check + CI + Vercel preview READY + PROTOCOL.md manual checks for UI changes); dev port 5170.
  - `byhris-ssr-gotchas` — triggers: code touching `window`/`document`/`localStorage`/time/random; hydration bugs; verifying animations. Rules: `next/dynamic({ssr:false})` for browser-only widgets; mounted-gate for client-only render values (Parallax, ThemeToggle, LiveTime precedents); StrictMode breaks AnimatePresence exits in dev → verify via `npm run build && npm run start`; dev screenshots can be blank → verify via build + HTML/console; Pages Router is deliberate — don't propose App Router.
  - `byhris-content-and-media` — triggers: adding/editing content or media; tempted to hardcode content in components. Rules: `src/data/projects.ts` is the single source of truth (CMS is Phase 4); media/image choices are user-owned — offer options + recommendation, never auto-apply (plumbing existing assets is fine); `<img>`→`next/image` deliberately deferred; hero eager-load deliberate.
- [ ] **Step 4:** `.claude/settings.json` (committed, project scope):

```json
{
  "extraKnownMarketplaces": {
    "house-rules": {
      "source": { "source": "github", "repo": "iliyanyotov/house-rules" }
    },
    "by-hris-designs": {
      "source": { "source": "github", "repo": "forressterr/by-hris-designs" }
    }
  },
  "enabledPlugins": {
    "house-rules@house-rules": true,
    "byhris-conventions@by-hris-designs": true
  }
}
```

- [ ] **Step 5:** Local install for this machine: `claude plugin marketplace add iliyanyotov/house-rules`, `claude plugin install house-rules@house-rules`, `claude plugin marketplace add .` (self, local path for pre-merge use). Verify: `claude plugin marketplace list` shows both.
- [ ] **Step 6:** Commit: `chore: set up Claude Code plugin marketplace with house-rules and project conventions`

### Task 8: House-rules quality pass on src/

**Files:** Per audit findings (background audit agent against all 52 skills; constraints already encoded: skip `caseStudy` any, `motion[as]` cast, index.css architecture, FormSubmit architecture, no-tests, `<img>`).

- [ ] **Step 1:** Triage findings: accept only high-confidence, real-bug or mechanical-safety items (latent race conditions, missing listener/timer cleanup, dead code, unsafe casts → `satisfies`); reject stylistic churn (KISS/YAGNI cut both ways).
- [ ] **Step 2:** Apply fixes; `npm run typecheck && npm run build` after each file.
- [ ] **Step 3:** Commit split by kind: `fix:` for latent bugs, `refactor:`/`chore:` for type-safety/dead-code (tidy-first: never mixed).

### Task 9: Docs

**Files:** Modify `PROTOCOL.md`, `docs/superpowers/BACKLOG.md`.

- [ ] **Step 1:** PROTOCOL.md — pre-commit section now states lint-staged **+ typecheck**, commit-msg commitlint, post-merge/checkout auto-install; new "CI" line: same five gates run on every PR/push via GitHub Actions.
- [ ] **Step 2:** BACKLOG.md — short "pre-Phase-2 baseline (house-rules + ground-floor + marketplace) DONE <date>" note in the header. Commit: `docs: document commit hooks, CI gate, and pre-phase-2 baseline`

### Task 10: Gate → PR → verify (→ merge only when fully green)

- [ ] **Step 1:** `npm run check` end-to-end green.
- [ ] **Step 2:** Behavior verification (PROTOCOL manual subset): `npm run build && npm run start` → console-clean snapshot/log check on `/`, `/works`, `/labs`, `/contact`, one `/projects/:slug` (build+start, not dev — StrictMode gotcha).
- [ ] **Step 3:** Push branch; `gh pr create` — body: what/why, the adaptation table above (incl. skipped items + rationale), verification evidence. Commits authored `h.goretsov <gorecov4@gmail.com>`, no AI trailer.
- [ ] **Step 4:** Verify GitHub Actions run green on the PR (first live run of Task 5) and Vercel preview deployment `READY`.
- [ ] **Step 5:** Merge only with: check green + CI green + preview READY + console-clean verification. After merge: confirm production deploy `READY` + https://www.byhris.cc HTTP 200.

### Task 11: Handoff

- [ ] **Step 1:** New top entry in `~/Desktop/SESSION_HANDOFF.md` (state, what landed, next = Phase 2 brainstorm).
- [ ] **Step 2:** Update auto-memory (dev-tooling + new house-rules/marketplace memory).
- [ ] **Step 3:** Report to user + present the Phase 2 brainstorm questions (FormSubmit-proxied vs Resend; Upstash confirmation; enquiry management scope).
