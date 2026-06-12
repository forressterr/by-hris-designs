# Phase 5 · Sub-project 2 — Playwright E2E smoke suite in CI — Design Spec

**Date:** 2026-06-12 · **Status:** approved design, pre-build · **Roadmap:** `docs/superpowers/BACKLOG.md` → Phase 5 (2 of 3: Sentry ✅ → **E2E** → randomised cron)

## 1. Goal & constraints

Add the app's **first automated test coverage** — a lean **Playwright smoke suite** that runs
against a production build and gates every push/PR in CI. Catches regressions (a route 500s, nav
breaks, the theme flashes, the Labs canvas fails to mount, the contact form breaks) before merge.

- **No CI side effects** — the contact-form submit is **stubbed** (network intercept); CI never
  sends a real email or writes to Upstash, and needs no Upstash/Resend/Sentry secrets.
- **Production build, not dev** — runs against `next build` + `next start` (matches prod + dodges
  the StrictMode/AnimatePresence dev gotcha).
- **Lean** — **Chromium only**, smoke depth (load + key interactions), house style (exact-pinned,
  prettier/eslint clean). Zero app-code change.

## 2. Decisions (from brainstorm, 2026-06-12)

| Decision       | Choice                                                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Runner         | `@playwright/test` (exact-pinned), Chromium project only.                                                                          |
| Target         | `webServer` = `npm run build && npm run start` (fresh prod build per run).                                                         |
| Contact submit | **Stubbed** via `page.route('**/api/contact', …)` — assert success + error UI without a real call.                                 |
| CI             | A separate **`e2e` job** in `.github/workflows/ci.yml` (parallel to `check`), on push/PR.                                          |
| Scope          | Routes load · nav active state · theme toggle (no-flash) · Labs canvas mounts · contact form render + validation + stubbed submit. |

## 3. Files

**Create:**

- `playwright.config.ts` (root) — `testDir: './e2e'`, Chromium project, `baseURL` localhost:3000, `webServer` (build+start, 120s timeout, `reuseExistingServer: !CI`), CI retries(2)/workers(1), HTML+list reporter.
- `e2e/smoke.spec.ts` — each route returns 200 + renders its `<h1>`/key content + `<title>` contains `By Hris`; unknown route → 404.
- `e2e/interactions.spec.ts` — nav active state on `/works`; theme toggle flips `html[data-theme]` (and it's set on load = no flash); `/labs` `LabsCanvas` mounts.
- `e2e/contact.spec.ts` — form renders; empty submit → client validation errors; valid + **stubbed** `{ok:true}` → success UI; stubbed `{ok:false}` → error UI.

**Modify:**

- `package.json` — `@playwright/test` dev dep + `"test:e2e": "playwright test"`.
- `.github/workflows/ci.yml` — add the `e2e` job.
- `.gitignore` — Playwright artifacts (`/test-results/`, `/playwright-report/`, `/blob-report/`, `/playwright/.cache/`).
- `.prettierignore` + `eslint.config.js` `ignores` — exclude `playwright-report/` + `test-results/`.

## 4. `playwright.config.ts` shape

```
testDir './e2e' · fullyParallel · forbidOnly:!!CI · retries: CI?2:0 · workers: CI?1:undefined
reporter: CI ? [['html',{open:'never'}],['list']] : 'list'
use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' }
projects: [{ name:'chromium', use: devices['Desktop Chrome'] }]
webServer: { command:'npm run build && npm run start', url:baseURL, timeout:120_000, reuseExistingServer:!CI }
```

## 5. Test scope (selectors confirmed against the components during build)

- **smoke** — `/`, `/works`, `/works/surge`, `/about`, `/labs`, `/contact` each: `goto` status 200,
  `<title>` matches `/By Hris/`, the site header nav is visible, the page `<h1>` is visible. `/works`
  asserts the project grid renders (≥1 `.project-card`); `/works/surge` asserts the case-study title.
  `/nope` → 404.
- **interactions** — on `/works` the active nav item carries its active marker (NavLink); on any page
  `html[data-theme]` is `light|dark` at first paint, and clicking the theme toggle flips it +
  persists (localStorage `theme-mode`); on `/labs` the `LabsCanvas` container mounts post-hydration.
- **contact** — on `/contact`: submitting empty shows the field validation copy; filling valid values
  - `page.route('**/api/contact', r => r.fulfill({ status:200, json:{ok:true} }))` + submit shows the
    success state; a `{ok:false}` fulfil shows the error state. The honeypot/timer never reach a real
    backend (stubbed).

## 6. CI — `e2e` job

```
e2e: (parallel to `check`, on pull_request + push to main)
  - checkout · setup-node 24 (npm cache) · npm ci
  - npx playwright install --with-deps chromium
  - npm run build
  - npx playwright test
  - upload-artifact playwright-report/ (if: failure)
```

No secrets needed (contact stubbed, Sentry/Upstash/Resend absent → their code paths are no-ops).

## 7. Verification

1. `npm run check` still green (Playwright is dev-only; app + build unchanged).
2. `npm run test:e2e` green locally (builds, starts, all specs pass headless Chromium).
3. Push → the new `e2e` CI job passes alongside `check`; Vercel preview unaffected.

## 8. Out of scope (YAGNI)

Cross-browser (Firefox/WebKit) · mobile viewports · visual-regression snapshots · real contact
submit · accessibility audits · component/unit tests (this is E2E smoke only).

## 9. Commit breakdown (tidy-first; authored `h.goretsov`)

1. `chore:` add `@playwright/test` + config + ignores + `test:e2e` script.
2. `test:` smoke + interactions + contact E2E specs.
3. `ci:` add the `e2e` job to the workflow.

## 10. Acceptance

- Chromium smoke suite covers every route + the core interactions + the contact form (stubbed),
  passing locally (`npm run test:e2e`) and as a CI job on push/PR.
- No real emails/Redis writes from CI; no new secrets required.
- `npm run check` stays green; zero app-code/behaviour change.
