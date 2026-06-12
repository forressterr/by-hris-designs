# Phase 2 — Contact-form Hardening (BotID blocking + Upstash ACL) — Design Spec

**Date:** 2026-06-13 · **Status:** approved (brainstorm) · **Roadmap:** `docs/superpowers/BACKLOG.md` → Phase 2 remaining hardening (the final backlog item; Phase 4 abandoned, Phase 5 done).

## Goal & context

Phase 2 shipped `POST /api/contact` (live since 2026-06-10): honeypot → BotID → request-timer → validation → rate-limit → capture (Upstash store **+** Resend email). Two hardening follow-ups were parked as ops notes and never designed in detail:

1. **BotID is monitor-only.** The route calls `checkBotId()` and logs the verdict but never blocks ([src/pages/api/contact.ts](../../../src/pages/api/contact.ts) step 2). Hard-blocking was disabled during the original rollout because real browsers were flagged `isBot:true` in production (the client challenge wasn't issuing tokens) — a hard block 403'd every visitor. **That root cause was never diagnosed**, so re-enabling blindly risks repeating the incident.
2. **The Upstash token is all-access.** A leaked `UPSTASH_REDIS_REST_TOKEN` (it lives in Vercel env) could `FLUSHALL` or read the whole keyspace.

This spec covers both, scaled to a single small PR (code) plus an operator runbook (no code).

## Locked decisions (from the brainstorm)

- **BotID → "instrument, then decide" (not a blind re-enable).** Add a default-off enforcement toggle + per-request verdict observability. Blocking is enabled later, from data, after confirming real browsers read as `human` on a Preview deploy. Diagnosing the original client-challenge bug is **deferred until the telemetry confirms it's still broken** (YAGNI — don't fix what we can't yet see).
- **Upstash ACL → least-privilege token, delivered as an operator runbook.** No app code (the route works with any token). The swap doubles as the post-incident credential rotation (see Security posture).
- **Resend key already rotated** by the user (2026-06-13) — runbook only needs the propagate-to-Vercel + local step.

## Part A — BotID: instrument, then decide (code)

### A1. New adapter `src/lib/contact/botid.ts`

A thin imperative adapter around the BotID SDK (keeps the route's shell readable, matching how `validation.ts` / `redis.ts` are split out). It owns the one I/O concern — calling `checkBotId` and surviving its throws.

```ts
import * as Sentry from '@sentry/nextjs';
import { checkBotId } from 'botid/server';
import type { IncomingHttpHeaders } from 'http';

export type BotIdVerdict = 'bot' | 'human' | 'error';

/**
 * Evaluate BotID for a request. Never throws: an off-platform call (local
 * `next start`) or a BotID outage resolves to 'error' (the caller fails open).
 * 'error' is captured to Sentry so outages are visible.
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

### A2. Enforcement toggle in `src/lib/contact/config.ts`

```ts
/** Whether BotID blocks (true) or only observes (default). Flip via Vercel env. */
export function isBotIdEnforced(): boolean {
  return process.env.CONTACT_BOTID_ENFORCE === 'true';
}
```

**Default off = today's monitor behaviour.** No code change re-enables it — a Vercel env var + redeploy does (~1 min), so rollback is one env flip away, never a revert PR.

### A3. Route change (`src/pages/api/contact.ts`, step 2)

Replace the inline try/catch block with:

```ts
// 2. BotID — observe always, block only when enforced. The verdict is tagged
//    (low-cardinality: bot|human|error) + logged so we can measure the
//    real-traffic flag-rate before ever blocking. 'error' fails open: a BotID
//    outage or local run must never reject a visitor.
const verdict = await evaluateBotId(req.headers);
Sentry.setTag('botid.verdict', verdict);
const enforced = isBotIdEnforced();
console.warn(`[contact] botid verdict=${verdict} enforce=${enforced}`);
if (verdict === 'bot' && enforced) {
  res.status(403).json({ ok: false, error: 'Access denied.' });
  return;
}
```

- **Observability:** `console.warn` (Vercel always captures stdout/stderr — the reliable source of truth) + `Sentry.setTag` (richer faceting once the Sentry DSN is added; a no-op while Sentry is inactive, so safe today). The tag value is bounded to three constants — no PII, no unbounded cardinality (house-rule: `bound-cardinality-in-keys`).
- **Decision rule:** block iff `verdict === 'bot'` **and** enforcement is on. Everything else (including `'error'`) continues — preserving the current graceful-degradation guarantee.

### A4. The "decide" path (operator, post-merge — safe, concrete)

1. Set `CONTACT_BOTID_ENFORCE=true` on **Preview only** in Vercel; redeploy the preview.
2. Submit the contact form from a **real browser** on the preview URL a few times.
3. Read the verdict in Vercel logs (`grep 'botid verdict'`) / Sentry (facet by `botid.verdict`):
   - **`human`** → the challenge works; enable `CONTACT_BOTID_ENFORCE=true` on **Production**. Bots now get a real 403.
   - **`bot`** → the client challenge is _still_ broken (now proven, zero prod impact). Leave enforcement off and diagnose the client side as a separate task.

### A5. `.env.example`

Document the new toggle under the Phase 2 block: default off, "set `true` to block BotID-flagged requests — verify on Preview with a real browser first (see the hardening spec)."

## Part B — Upstash ACL token (operator runbook, no code)

Verified feasible: Upstash supports Redis 6.2 ACLs via `ACL SETUSER` and mints a scoped REST token via its `ACL RESTTOKEN <user> <password>` extension.

### B1. Exact least-privilege scope

The route's real command set: **GET, INCRBY, PEXPIRE** (the `@upstash/ratelimit` sliding-window Lua script, run via `EVALSHA`) on `ratelimit:contact:*`, plus **SET** (the enquiry store) on `enquiry:*`. Category grants cover these robustly and survive a library bump (an over-tight explicit list would risk a `NOPERM` that silently disables rate-limiting, since it fails open):

```
ACL SETUSER contact-app on >'<STRONG-PASSWORD>' \
  resetchannels ~enquiry:* ~ratelimit:contact:* \
  +@read +@write +@scripting -@dangerous
ACL RESTTOKEN contact-app '<STRONG-PASSWORD>'
```

- `+@read +@write` → GET / SET / INCRBY / PEXPIRE. `+@scripting` → EVAL / EVALSHA / SCRIPT (the rate limiter). `-@dangerous` → strips FLUSHALL / FLUSHDB / KEYS / CONFIG / SHUTDOWN / ACL / DEBUG (none of which the route uses).
- `~enquiry:* ~ratelimit:contact:*` → confines the user to exactly the two key spaces. `resetchannels` → no pub/sub (unused).
- Net: a leaked token can read/write only contact keys and **cannot** wipe the DB or read anything else.

### B2. Steps (operator)

1. Upstash Console → `by-hris-contact-database` → **CLI** tab. Run the two `ACL` commands above (use a strong generated password; it's not stored anywhere after).
2. Copy the token `ACL RESTTOKEN` prints.
3. Vercel → Settings → Environment Variables → replace `UPSTASH_REDIS_REST_TOKEN` (Production **+** Preview, marked **Sensitive**) with the new token. Update local `.env.local` too.
4. Redeploy.

### B3. Verification (operator, post-swap) — the critical checks

With the **new** token (`$T = new token`, `$U = UPSTASH_REDIS_REST_URL`):

```bash
# in-scope write works (then clean up)
curl -s "$U/set/enquiry:acltest/ok" -H "Authorization: Bearer $T"     # expect {"result":"OK"}
curl -s "$U/del/enquiry:acltest"    -H "Authorization: Bearer $T"     # expect {"result":1}
# out-of-scope key denied
curl -s "$U/get/foo"      -H "Authorization: Bearer $T"               # expect NOPERM error
# destructive denied
curl -s "$U/flushall"     -H "Authorization: Bearer $T"               # expect NOPERM error
```

Then the **does-rate-limiting-still-work** check (the EVALSHA script must run under the new ACL — it fails open, so a silent break wouldn't surface otherwise): submit the live form 6× rapidly → the 6th returns `429`.

## Security posture (the April 2026 Vercel incident)

On **2026-04-19** Vercel disclosed unauthorized access to internal systems and advised all customers to rotate env-var credentials. Every secret stored in this project's Vercel env since before that date should be rotated:

| Secret                     | Action                                                                                                    | Status                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `UPSTASH_REDIS_REST_TOKEN` | Replaced by the scoped ACL token (B2) — rotation **+** least-privilege in one.                            | this cycle                    |
| `RESEND_API_KEY`           | Rotated in Resend dashboard. **Propagate** the new key to Vercel (Prod+Preview) + `.env.local`, redeploy. | rotated 2026-06-13; propagate |
| Sentry tokens              | Being added now (post-incident) → already clean.                                                          | n/a                           |

(Refs: [Upstash REST API / ACL RESTTOKEN](https://upstash.com/docs/redis/features/restapi); [Rotate Upstash Secrets After Vercel's April 2026 Incident](https://upstash.com/blog/rotate-upstash-secrets-after-vercel-incident).)

## Files

| File                        | Change     | Responsibility                                                                              |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| `src/lib/contact/botid.ts`  | **Create** | `evaluateBotId(headers) → BotIdVerdict`; wraps `checkBotId`, captures throws, never throws. |
| `src/lib/contact/config.ts` | Modify     | Add `isBotIdEnforced()`.                                                                    |
| `src/pages/api/contact.ts`  | Modify     | Use the adapter; tag + log the verdict; 403 only when `bot` **and** enforced.               |
| `.env.example`              | Modify     | Document `CONTACT_BOTID_ENFORCE`.                                                           |
| this spec                   | doc        | Carries the ACL + rotation runbook the operator executes.                                   |

## Scope / non-goals (YAGNI)

Not in this cycle: BotID **deepAnalysis** (paid); **fixing the client challenge** (instrument first — only diagnose if telemetry proves it broken); an **admin UI**; **Redis verdict-counters** (Vercel logs + Sentry suffice at portfolio volume); changing rate-limit thresholds; rotating Resend _in code_ (it's a dashboard action, tracked above).

## Testing & verification

- **Gate:** `npm run check` (lint · format · typecheck · audit-high · build) green.
- **No app behaviour change by default** — enforcement is off, so the route behaves exactly as today. The Phase 5 E2E suite stubs `/api/contact`, so it's unaffected and stays green.
- **Local reasoning check:** with `CONTACT_BOTID_ENFORCE=true` locally, `checkBotId` throws off-platform → verdict `error` → request still continues (fail-open proven; enforcement only bites where BotID actually runs, i.e. Vercel).
- **Operator checks** (post-merge): the A4 Preview verdict test; the B3 ACL verification.

## Acceptance criteria

- Default behaviour unchanged; `npm run check` + CI + Vercel preview green; production unaffected on merge.
- BotID blocking is one Vercel env flip away, with per-request verdict observability and a guaranteed fail-open on errors.
- A least-privilege Upstash token (can't `FLUSHALL`/read foreign keys, rate-limiter intact) is documented end-to-end with verification, and replaces the pre-incident all-access token.
- The post-incident rotation of all Vercel-stored secrets is tracked to closure.

## Self-review notes

- **No placeholders.** Every code block is complete; `<STRONG-PASSWORD>` is an operator input, not a code value.
- **Consistency.** `BotIdVerdict` / `evaluateBotId` / `isBotIdEnforced` / `CONTACT_BOTID_ENFORCE` names match across A1–A5 and the Files table. The route change slots into the existing step-2 position.
- **House-rules honoured:** functional-core/imperative-shell (thin adapter + thin shell), graceful-degradation/fail-open (error verdict continues), bound-cardinality (3-value tag), secrets-handling (no token/PII logged; generic 403 string), yagni (deferrals listed).
- **Scope:** single small PR (4 files) + a runbook; focused enough for one implementation plan.
