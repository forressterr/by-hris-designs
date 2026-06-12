# Phase 2 Hardening (BotID blocking + Upstash ACL) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make BotID blocking re-enablable from a default-off env toggle with per-request verdict observability (no behaviour change by default), and document an exact least-privilege Upstash ACL token + the post-incident secret rotation.

**Architecture:** A thin `src/lib/contact/botid.ts` adapter wraps `checkBotId` and never throws (off-platform / outage → `'error'`). `config.ts` gains `isBotIdEnforced()` reading `CONTACT_BOTID_ENFORCE`. The route's step 2 becomes: evaluate → tag+log the verdict → `403` only when `verdict==='bot'` **and** enforced; everything else (incl. `'error'`) continues (fail-open preserved). The Upstash ACL is operator work (no code) carried by the spec runbook.

**Tech Stack:** Next.js 15 (Pages Router), React 19, strict TS, `botid`, `@sentry/nextjs`, `@upstash/redis` + `@upstash/ratelimit`.

**Spec:** `docs/superpowers/specs/2026-06-13-phase2-hardening-design.md`

**Branch:** `feat/phase2-hardening` (already created; the spec commit `c89d0a9` is on it).

**Testing note:** No unit-test runner exists in this repo (Phase 5 added Playwright E2E only, and `e2e/contact.spec.ts` _stubs_ `/api/contact`, so it cannot exercise the verdict logic). Per the spec + the Phase 2/5 convention, verification is the `npm run check` gate (TypeScript enforces every contract here), the unaffected E2E suite as a regression guard, local fail-open reasoning, and the operator runbook — not failing-unit-tests-first. Adding a unit runner for a 3-file change is out of scope (YAGNI).

**Conventions:** commits authored `h.goretsov <gorecov4@gmail.com>`, conventional messages, no AI trailer; `npm run check` green before the PR; don't merge until check + CI + Vercel preview are green (final merge is the user's call — the ops steps are theirs to run).

---

## File map

| File                        | Create/Modify | Responsibility                                                                               |
| --------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| `src/lib/contact/botid.ts`  | Create        | `evaluateBotId(headers) → BotIdVerdict` — wraps `checkBotId`, captures throws, never throws. |
| `src/lib/contact/config.ts` | Modify        | Add `isBotIdEnforced()`.                                                                     |
| `.env.example`              | Modify        | Document `CONTACT_BOTID_ENFORCE`.                                                            |
| `src/pages/api/contact.ts`  | Modify        | Consume the adapter; tag + log the verdict; `403` only when `bot` **and** enforced.          |

---

## Task 1: BotID adapter

**Files:** Create `src/lib/contact/botid.ts`.

- [ ] **Step 1: Create `src/lib/contact/botid.ts`.**

```ts
// A thin adapter around Vercel BotID's server check. Its one job is to produce
// a verdict and survive the SDK's throws: checkBotId throws off-platform (local
// `next start`) and during a BotID outage, which must never crash the contact
// route. Splitting it out keeps the route's pipeline shell readable, like
// validation.ts / redis.ts.

import * as Sentry from '@sentry/nextjs';
import { checkBotId } from 'botid/server';
import type { IncomingHttpHeaders } from 'http';

export type BotIdVerdict = 'bot' | 'human' | 'error';

/**
 * Evaluate BotID for a request. Never throws: an off-platform call or a BotID
 * outage resolves to 'error' (the caller fails open). 'error' is captured to
 * Sentry so outages stay visible.
 */
export async function evaluateBotId(
  headers: IncomingHttpHeaders,
): Promise<BotIdVerdict> {
  try {
    const { isBot } = await checkBotId({ advancedOptions: { headers } });
    return isBot ? 'bot' : 'human';
  } catch (err) {
    Sentry.captureException(err);
    return 'error';
  }
}
```

- [ ] **Step 2: Typecheck.**

Run: `npm run typecheck`
Expected: no errors (confirms `botid/server`'s `checkBotId` accepts `{ advancedOptions: { headers } }` with `IncomingHttpHeaders`, and the return has `isBot`).

- [ ] **Step 3: Commit.**

```bash
git add src/lib/contact/botid.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add botid adapter that yields a verdict and never throws"
```

---

## Task 2: Enforcement toggle + docs

**Files:** Modify `src/lib/contact/config.ts`, `.env.example`.

- [ ] **Step 1: Append `isBotIdEnforced()` to `src/lib/contact/config.ts`** (after the existing `getUpstashConfig` function):

```ts
/**
 * Whether BotID BLOCKS flagged requests (true) or only observes them (default).
 * Off by default = monitor mode. Flip with the CONTACT_BOTID_ENFORCE env var
 * (Vercel) + a redeploy — no code change needed to enable or roll back.
 */
export function isBotIdEnforced(): boolean {
  return process.env.CONTACT_BOTID_ENFORCE === 'true';
}
```

- [ ] **Step 2: Document the toggle in `.env.example`** — add this block immediately after the `# RESEND_API_KEY=` line (still inside the `Phase 2` section):

```
#
# Optional: set to "true" to make BotID BLOCK flagged requests. Default (unset)
# = monitor only — the route observes + logs the verdict but never blocks.
# Verify on a Preview deploy with a real browser BEFORE enabling in Production
# (see docs/superpowers/specs/2026-06-13-phase2-hardening-design.md).
# CONTACT_BOTID_ENFORCE=
```

- [ ] **Step 3: Typecheck.**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit.**

```bash
git add src/lib/contact/config.ts .env.example
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: add CONTACT_BOTID_ENFORCE toggle (default off) and document it"
```

---

## Task 3: Wire the verdict + toggle into the route

**Files:** Modify `src/pages/api/contact.ts`.

- [ ] **Step 1: Swap the imports.** Replace the current `botid/server` import line:

```ts
import { checkBotId } from 'botid/server';
```

with these two (the route no longer calls the SDK directly; it uses the adapter + the toggle):

```ts
import { evaluateBotId } from '../../lib/contact/botid';
import { isBotIdEnforced } from '../../lib/contact/config';
```

Leave the `import * as Sentry from '@sentry/nextjs';` line in place — it's still used by `Sentry.setTag` below and the rate-limit/store catch blocks.

- [ ] **Step 2: Replace the entire step-2 BotID block.** Replace this (the current monitor-mode try/catch, comment included):

```ts
// 2. BotID (basic) — MONITOR MODE (does not block). The client-side
//    challenge (instrumentation-client `initBotId`) is not issuing tokens in
//    production, so checkBotId() returns isBot:true for real browsers too — a
//    hard block rejected legitimate visitors. We log the verdict but allow the
//    request through; the honeypot, request-timer, per-IP rate-limit and
//    server-side validation remain the active bot defenses. Re-enable blocking
//    only once the client challenge is confirmed working in production (see
//    BACKLOG Phase 2). checkBotId also throws off-platform (local `next start`,
//    or a BotID outage) — caught here.
try {
  const bot = await checkBotId({ advancedOptions: { headers: req.headers } });
  if (bot.isBot) {
    console.warn(
      '[contact] BotID flagged this request as a bot (monitor mode — not blocking)',
    );
  }
} catch (err) {
  console.error(
    '[contact] BotID check unavailable:',
    err instanceof Error ? err.message : err,
  );
  Sentry.captureException(err);
}
```

with:

```ts
// 2. BotID — observe always, block only when enforced. Tag (low-cardinality:
//    bot|human|error) + log the verdict so the real-traffic flag-rate is
//    measurable before we ever block. 'error' fails open: an off-platform run
//    or a BotID outage must never reject a visitor. Re-enable blocking by
//    setting CONTACT_BOTID_ENFORCE=true once a Preview deploy confirms real
//    browsers read as 'human' (see the phase-2-hardening spec).
const verdict = await evaluateBotId(req.headers);
Sentry.setTag('botid.verdict', verdict);
const enforced = isBotIdEnforced();
console.warn(`[contact] botid verdict=${verdict} enforce=${enforced}`);
if (verdict === 'bot' && enforced) {
  res.status(403).json({ ok: false, error: 'Access denied.' });
  return;
}
```

- [ ] **Step 3: Typecheck + build.**

Run: `npm run typecheck && npm run build`
Expected: no errors; the build route table lists `ƒ /api/contact`. (The build also refreshes `.next/types`, so the pre-commit typecheck in Step 4 runs clean.)

- [ ] **Step 4: Commit.**

```bash
git add src/pages/api/contact.ts
git commit --author="h.goretsov <gorecov4@gmail.com>" -m "feat: make contact BotID block behind CONTACT_BOTID_ENFORCE with verdict telemetry"
```

---

## Task 4: Gate + local verification (no commit)

**Files:** none.

- [ ] **Step 1: Full gate.**

Run: `npm run check`
Expected: lint, format:check, typecheck, `npm audit --audit-level=high`, and build all pass; build lists `/api/contact`.

- [ ] **Step 2: Confirm no default behaviour change + fail-open, locally.** Start the prod server (stop any preview "Next Dev" on 5170 first to avoid the `.next` clobber):

```bash
npm run build && npm run start
```

Then, with `CONTACT_BOTID_ENFORCE` unset, a valid submit still succeeds and the log shows the verdict line:

```bash
BASE=http://localhost:3000/api/contact
H='Content-Type: application/json'
curl -s -w " valid:%{http_code}\n" -H "$H" -d '{"name":"Jane Doe","email":"jane@example.com","message":"Hello, I have a project in mind and would love to chat.","elapsedMs":9000}' "$BASE"
```

Expected: `valid:200`. The server log shows `[contact] botid verdict=error enforce=false` (off-platform `checkBotId` throws → `error` → request continues). This is the fail-open proof: even if you export `CONTACT_BOTID_ENFORCE=true` and restart, the same request still returns `200` (a `bot` verdict never occurs locally; `error` always continues). Clean up the test enquiry if Upstash is configured locally:

```bash
set -a; source .env.local 2>/dev/null; set +a
for k in $(curl -s "$UPSTASH_REDIS_REST_URL/keys/enquiry:*" -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" | grep -oE 'enquiry:[0-9a-z-]+'); do curl -s "$UPSTASH_REDIS_REST_URL/del/$k" -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" >/dev/null; done; echo cleaned
```

- [ ] **Step 3:** No commit (verification only). If anything failed, fix the adapter/route/config and re-run from Step 1.

---

## Task 5: PR + operator handoff

**Files:** none.

- [ ] **Step 1: Push the branch.**

```bash
git push -u origin feat/phase2-hardening
```

- [ ] **Step 2: Open the PR** (`gh pr create`, base `main`). Body must include: what/why (instrument-then-decide BotID + ACL token), that there is **no default behaviour change** (enforcement off), and the **operator runbook** copied from the spec so it's actionable from the PR:
  - **BotID decide-path:** set `CONTACT_BOTID_ENFORCE=true` on **Preview**, submit the form from a real browser, check the verdict (Vercel logs / Sentry). `human` → enable on Production; `bot` → leave off, the client challenge is still broken (diagnose separately).
  - **Upstash ACL** (`ACL SETUSER contact-app on >'<pw>' resetchannels ~enquiry:* ~ratelimit:contact:* +@read +@write +@scripting -@dangerous` → `ACL RESTTOKEN contact-app '<pw>'`) → put the token in Vercel `UPSTASH_REDIS_REST_TOKEN` (Prod+Preview, Sensitive) → redeploy → run the NOPERM + 6×→429 verification.
  - **Resend:** propagate the freshly rotated `RESEND_API_KEY` to Vercel (Prod+Preview) + `.env.local` → redeploy.

- [ ] **Step 3: Verify CI + Vercel green.**

Run: `gh pr checks <pr> --watch`
Expected: `check` and `e2e` both pass (the E2E stub is unaffected); Vercel preview `READY`. The build is a no-op without any new env, so the preview is green with no secrets.

- [ ] **Step 4: Merge is the user's call.** Do **not** auto-merge. Once the user approves: squash/merge, delete the branch, confirm the production deploy `READY`. Then the user runs the three operator steps above (each is a Vercel/Upstash action, not a code change).

- [ ] **Step 5: Post-merge bookkeeping.** Update `docs/superpowers/BACKLOG.md` (Phase 2 hardening done), `~/Desktop/SESSION_HANDOFF.md`, and the `byhris-phase5-health` / `byhris-contact-api` memories to record the toggle + ACL token.

---

## Self-review notes

- **Spec coverage:** A1 adapter → Task 1; A2 toggle → Task 2 Step 1; A5 `.env.example` → Task 2 Step 2; A3 route change → Task 3; A4 decide-path → Task 5 Step 2 (operator); Part B ACL runbook → Task 5 Step 2 (operator); Security posture (Resend propagate) → Task 5 Step 2; verification (gate, fail-open, E2E-unaffected) → Task 4 + Task 5 Step 3. Every spec section maps to a task.
- **No placeholders:** every code/edit step shows the exact content; the only `<pw>` / `<pr>` tokens are operator/CLI inputs, not code.
- **Type consistency:** `BotIdVerdict` / `evaluateBotId` (Task 1) consumed unchanged in Task 3; `isBotIdEnforced` (Task 2) consumed in Task 3; the route keeps `Sentry`, `req`, and the `res`/`ContactApiResponse` shape it already uses. `CONTACT_BOTID_ENFORCE` spelled identically in config, `.env.example`, route comment, and runbook.
- **Scope:** 3 code files + a doc, 3 commits on an existing branch — one focused PR.
