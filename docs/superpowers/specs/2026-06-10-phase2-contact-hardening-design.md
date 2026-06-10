# Phase 2 — Contact-form Hardening (server-side) — Design

**Status:** approved 2026-06-10 · **Phase:** 2 of the rework roadmap (`docs/superpowers/BACKLOG.md`)

## Goal & context

Move the contact form's submission server-side. Today `src/components/ContactForm.tsx`
POSTs JSON **straight from the browser** to `https://formsubmit.co/ajax/h.goretsov@gmail.com`:
the inbox address ships in the client bundle, there is no rate limiting, and the only bot
defense is a honeypot. Phase 1 added the Next.js server foundation, so this is unblocked.

Phase 2 introduces `POST /api/contact` — a Pages-Router API route that runs every integrity
check server-side, persists each enquiry to Upstash Redis (30-day TTL), forwards to the inbox
via FormSubmit, and removes the inbox/endpoint from the client bundle.

## Locked decisions (from BACKLOG + this brainstorm)

- **Email transport:** keep **FormSubmit, proxied server-side** (Resend stays a future swap; no form change needed to switch later).
- **Store:** **Upstash Redis** (`by-hris-contact-database`, free tier, GCP `europe-west1`; REST creds live-verified 2026-06-10, in the gitignored `.env.local`). One instance backs both the rate limiter and the enquiry store.
- **Enquiry management:** **store + email only**, no admin UI. The store is a durable backup/audit record; the email is the notification acted on.
- **Bot protection:** **Vercel BotID, basic mode** (code-level; deep-analysis is a paid tier, revisit only if bots get through).
- **Retention:** stored enquiries expire after **30 days** (tight-privacy choice; the "encryption-at-rest" mitigation = minimal PII that auto-expires).
- **Request-timer:** **simple client timer** — form stamps mount time, client sends elapsed-since-mount, server rejects implausibly fast submits. Soft signal paired with the honeypot; BotID is the real defense. (The contact pages are statically generated, so there is no server render to issue a signed token.)
- **Defaults kept (brainstorm):** **(a)** no enquiry index (TTL'd keys only — an index would not auto-expire with the keys → unbounded-growth risk; add one with a future admin UI); **(b)** no IP stored (rate-limiter handles abuse; avoids extra PII + a salt env var); **(c)** region pinned via a committed `vercel.json` (visible + version-controlled, deliberately unlike the invisible dashboard setting that caused Phase 1's production outage).

## Module layout (functional core / imperative shell)

| File                                   | Responsibility                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/contact/validation.ts`        | Pure validators + types + constants, **extracted from ContactForm**. Single source of truth used by **both** client (live UX validation) and server (security gate). Exports: `MAX_MESSAGE_LENGTH`, `validateName/validateEmail/validateMessage`, `VALIDATORS` map, `validateEnquiry(values): FormErrors`; types `FieldName`, `EnquiryInput`, `FormErrors`. Regex patterns stay module-internal. |
| `src/lib/contact/config.ts`            | `getContactConfig()` → typed `{ upstashUrl, upstashToken, formsubmitEndpoint }`; throws a clear error (fail-fast) if any var is missing. Never logs secret values.                                                                                                                                                                                                                               |
| `src/lib/contact/redis.ts`             | Upstash client singleton (`@upstash/redis` from config) + `@upstash/ratelimit` sliding-window instance + `storeEnquiry(enquiry: StoredEnquiry): Promise<void>`.                                                                                                                                                                                                                                  |
| `src/lib/contact/types.ts`             | `StoredEnquiry` (= `EnquiryInput` + `id`, `createdAt`) and the `ContactApiResponse` union.                                                                                                                                                                                                                                                                                                       |
| `src/pages/api/contact.ts`             | The route — thin imperative shell orchestrating the pipeline; delegates validation to `validation.ts` and storage/rate-limit to `redis.ts`.                                                                                                                                                                                                                                                      |
| `instrumentation-client.ts`            | `initBotId({ protect: [{ path: '/api/contact', method: 'POST' }] })` (BotID basic; covers the footer form on every page + the contact page).                                                                                                                                                                                                                                                     |
| `next.config.js`                       | Wrapped with BotID's config helper (`withBotId`) so the bot-check proxy rewrites are installed. Existing security headers preserved.                                                                                                                                                                                                                                                             |
| `vercel.json` (new)                    | `{ "$schema": "https://openapi.vercel.sh/vercel.json", "regions": ["fra1"] }` — pin the function next to the DB (Belgium); avoids Vercel's default `iad1` transatlantic round-trip.                                                                                                                                                                                                              |
| `src/components/ContactForm.tsx`       | POST to `/api/contact`; import shared validators (delete the ~80 local lines); send `elapsedMs`; interpret the `{ ok }` response. Honeypot, status machine, and the earlier idle-timer fix stay.                                                                                                                                                                                                 |
| `.env.example` / `.env.local` / Vercel | Document + carry the three env vars.                                                                                                                                                                                                                                                                                                                                                             |

> **Exact `botid` import paths** (`botid/client/core`, `botid/server`, `botid/next/config`) and the `@upstash/ratelimit` API are verified against the installed package versions during implementation.

## Request pipeline (`POST /api/contact`)

Order = cheapest / most-decisive first, so junk never reaches the expensive steps:

1. **Method guard** — non-`POST` → `405`.
2. **Parse body** — JSON; malformed → `400`. Narrow `unknown` → `EnquiryInput` once (parse-don't-validate).
3. **Honeypot** — `_honey` non-empty → silent `200 { ok: true }` (bot believes it succeeded; no store, no forward).
4. **BotID** — `await checkBotId()`; `isBot` → `403 { ok: false }`.
5. **Request-timer** — `elapsedMs < MIN_FILL_MS` (2500 ms) → silent `200 { ok: true }` (treated like the honeypot; threshold not leaked).
6. **Validation** — `validateEnquiry(values)`; any error → `400 { ok: false, error, fields }` (defense in depth; client already validated for UX).
7. **Rate limit** — `ratelimit.limit(ip)` sliding window (**5 requests / 10 min per IP**); exceeded → `429 { ok: false, error }`. IP from `x-forwarded-for` (first hop), fallback constant.
8. **Store** — `storeEnquiry()` to Redis with 30-day TTL. Best-effort: on failure, log + continue (the email is the real notification).
9. **Forward** — server POSTs to `CONTACT_FORMSUBMIT_ENDPOINT` (`_template: 'table'`, `_captcha: 'false'`, `_replyto`, `_subject`); FormSubmit non-success → `502 { ok: false, error }`.
10. **Respond** — `200 { ok: true }`.

## Failure policy

- **Fail-open** on rate-limit / store / Redis infra errors — a Redis hiccup must never take the contact form down. Log and continue.
- **Fail-closed** on delivery — FormSubmit failure → `502`, the user retries. The enquiry is **already stored**, so nothing is silently lost.
- **Secrets-handling** — generic user-facing error strings; logs carry counters/shape only, never PII, the inbox, or the token.

## Data model (Redis)

- **Key:** `enquiry:<id>` where `<id>` is a time-sortable id (`${Date.now()}-${short-random}`).
- **Value:** JSON `{ id, name, email, message, createdAt }` (ISO `createdAt`). Minimal PII; no IP.
- **TTL:** `EX` 30 days (`ENQUIRY_TTL_SECONDS = 60 * 60 * 24 * 30`). Keys auto-expire — nothing accumulates (steady-state-purge satisfied without a separate purge job).
- **No index.** A future admin UI can `SCAN enquiry:*` (trivial at portfolio volume) or add an index then.

## Client changes (`ContactForm.tsx`)

- Import the shared validators from `src/lib/contact/validation.ts`; delete the local copies (DRY).
- On mount (`useEffect`): record `mountedAt` in a ref.
- On submit: POST `/api/contact` with `{ name, email, message, _honey, elapsedMs: Date.now() - mountedAt }`. Remove the hardcoded FormSubmit endpoint/email and the `_subject`/`_template`/`_captcha`/`_replyto` payload fields (now server-owned).
- Response: `const data = await res.json()`; success = `res.ok && data.ok`. Map `data.fields` back to per-field errors when present; otherwise show the toast as today.
- Keep: honeypot input, the `status` state machine, and the tracked idle-timer fix.
- BotID `initBotId` runs globally via `instrumentation-client.ts`, so both the footer form (every page) and the contact page are covered.

## Env / config contract

| Var                           | Purpose                                                                               | Where                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`      | Upstash REST endpoint                                                                 | `.env.local` ✅ · Vercel (Prod+Preview) — **user adds** |
| `UPSTASH_REDIS_REST_TOKEN`    | Upstash REST token (mark **Sensitive** in Vercel)                                     | `.env.local` ✅ · Vercel — **user adds**                |
| `CONTACT_FORMSUBMIT_ENDPOINT` | Full FormSubmit AJAX URL incl. inbox/alias — keeps the email out of the repo + bundle | `.env.local` + Vercel — **user adds**                   |

`config.ts` validates all three are present at first use (fail-fast). `.env.example` documents them (no values).

## Security posture (ops, tracked in BACKLOG)

- **Upstash account MFA** — user enables (free; Upstash console → Settings).
- **ACL-scoped token** — once the route's exact command set is known (rate-limiter `EVAL` + `SET`/`GET`, optional `SCAN`), mint an Upstash ACL user restricted to those commands + the `enquiry:*` / rate-limit key prefixes, and put that token in Vercel — the deployed app then cannot `FLUSHALL` or read other keys. The route works with either token; this is a deploy-time hardening step.
- **Region** — `fra1` via `vercel.json` (next to the DB).
- **BotID** — basic mode; no dashboard toggle required.

## Scope / non-goals (YAGNI)

Not in this phase: admin UI · enquiry index / pagination · IP storage · Resend · BotID deep-analysis · signed-token timer · a test framework (deferred to Phase 5).

## Testing approach

No test framework is stood up this phase — the roadmap defers automated testing (Playwright + CI E2E) to Phase 5, and that ordering takes precedence here. Verification for Phase 2:

- **Gate:** `npm run check` (lint · format · typecheck · audit-high · build) green.
- **Manual matrix** via `npm run build && npm run start` + curl/REST against the route: valid → `200 { ok: true }` + an `enquiry:*` key appears in Redis (verified over REST) + email arrives; honeypot filled → `200`, no store; `elapsedMs` too small → `200`, no store; invalid field → `400` + `fields`; 6th rapid submit → `429`; malformed body → `400`.
- The validators in `validation.ts` are pure functions — structured so Phase 5 can add unit tests with no refactor (functional-core).

## Acceptance criteria

- Humans submit fine; the inbox/endpoint no longer appears in the client bundle.
- Bots are blocked or silently dropped (BotID + honeypot + request-timer); rapid repeats are rate-limited (429).
- Each accepted enquiry lands in Redis with a 30-day TTL **and** reaches the inbox; delivery failure surfaces to the user (502) with the enquiry already stored.
- `npm run check` green; CI green on the PR; Vercel preview `READY`; production deploy `READY` + www.byhris.cc 200 after merge.
