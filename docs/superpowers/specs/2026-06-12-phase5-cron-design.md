# Phase 5 · Sub-project 3 — Randomised daily E2E cron — Design Spec

**Date:** 2026-06-12 · **Status:** approved design, pre-build · **Roadmap:** `docs/superpowers/BACKLOG.md` → Phase 5 (3 of 3: Sentry ✅ → E2E ✅ → **cron**)

## 1. Goal & constraints

Run the Phase-5.2 Playwright smoke suite **daily on a schedule**, with a **randomised start**,
so regressions from _external drift_ — a Vercel/Next/dependency change, a content edit, an expired
cert — surface even with no push. Catches what push-triggered CI can't.

- **Randomised start** (the explicit backlog ask) — a `sleep` jitter so the run never fires at a
  fixed instant.
- **Reuse, don't duplicate** — runs the existing `npm run test:e2e` (no new test code).
- **No new secrets** — the suite stubs `/api/contact`; nothing else is needed.
- **Failure is loud** — GitHub emails the repo owner when a scheduled workflow fails (default).

## 2. Decisions

| Decision      | Choice                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Mechanism     | A dedicated GitHub Actions workflow with `schedule:` (cron) + `workflow_dispatch` (manual).                      |
| Time          | `cron: '0 6 * * *'` (06:00 UTC nominal).                                                                         |
| Jitter        | First step `sleep $((RANDOM % 2700))` → a random 0–45 min offset (the randomised start).                         |
| Runner        | Reuses the E2E recipe: checkout → setup-node 24 → `npm ci` → `playwright install chromium` → `npm run test:e2e`. |
| Notifications | GitHub's built-in "scheduled workflow failed" email to the owner (no Slack/webhook).                             |

## 3. Files

**Create:** `.github/workflows/e2e-daily.yml` — the scheduled workflow (SHA-pinned actions matching `ci.yml`; `timeout-minutes: 60` to cover jitter + run; `concurrency` guard; `permissions: contents: read`).

No app-code change.

## 4. Workflow shape

```
on: { schedule: [{ cron: '0 6 * * *' }], workflow_dispatch: {} }
permissions: { contents: read }
concurrency: { group: e2e-daily, cancel-in-progress: false }
env: { NEXT_TELEMETRY_DISABLED: 1 }
jobs.e2e (ubuntu-latest, timeout 60):
  - Randomised start: sleep $((RANDOM % 2700))   # 0–45 min
  - checkout · setup-node 24 (npm cache) · npm ci
  - npx playwright install --with-deps chromium
  - npm run test:e2e
```

`schedule` only fires on the **default branch** (main), so the daily run begins once merged.

## 5. Verification

1. `npm run check` green (workflow-only change; app untouched).
2. The workflow YAML parses on push (visible under Actions; no "invalid workflow" error).
3. **After merge:** trigger once via **Run workflow** (`workflow_dispatch`) → confirm the suite runs
   green end-to-end on the schedule path (the jitter `sleep` is skipped fast enough on manual runs,
   or accept the wait).

## 6. Out of scope (YAGNI)

Slack/webhook notifications · Vercel Cron (app-side jobs) · multiple schedules/timezones · running
against the live production URL (this runs its own build, same as CI) · matrix browsers.

## 7. Acceptance

- A daily scheduled workflow runs the E2E smoke suite with a randomised 0–45 min start; manual
  `workflow_dispatch` works; failures email the owner.
- `npm run check` stays green; zero app change.
