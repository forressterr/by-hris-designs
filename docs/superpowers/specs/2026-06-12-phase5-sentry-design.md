# Phase 5 · Sub-project 1 — Sentry error + performance monitoring — Design Spec

**Date:** 2026-06-12 · **Status:** approved design, pre-plan · **Roadmap:** `docs/superpowers/BACKLOG.md` → Phase 5 (1 of 3: Sentry → Playwright E2E → randomised cron)

## 1. Goal & constraints

Wire **Sentry** into the Next 15 / Pages Router app to catch **production errors + performance**
(Web Vitals + transaction/API timing) — including the `/api/contact` route — with readable
stack traces (source maps). Constraints:

- **No session replay / profiling** (lean, free-tier-friendly, privacy).
- **PII never leaves** — `sendDefaultPii: false` + a scrubber that strips the contact enquiry
  fields (name/email/message) and IPs.
- **`npm run check` + GitHub CI stay green with no Sentry secrets** — source-map upload happens
  only on Vercel (where the auth token lives); local/CI builds skip upload gracefully.
- **House style** — hand-written config (no Sentry wizard), exact-pinned dep, composes with the
  existing `withBotId` wrapper and BotID `instrumentation-client.ts`. Zero visual change for users.

## 2. Decisions (from brainstorm, 2026-06-12)

| Decision           | Choice                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Capture scope      | **Errors + performance.** No replay, no profiling.                                                                          |
| Setup method       | **Manual `@sentry/nextjs` config** (not the wizard — it collides with the custom `next.config.js` + BotID instrumentation). |
| Source maps        | **Uploaded on Vercel only** (`SENTRY_AUTH_TOKEN` there); CI/local skip upload.                                              |
| PII                | `sendDefaultPii: false` + shared `beforeSend`/`beforeSendTransaction` scrubber.                                             |
| Traces sample rate | `1.0` (low traffic; one tunable constant).                                                                                  |
| Error pages        | Add `src/pages/_error.tsx` (Sentry's documented Pages-Router hook); default Next error UI (styling it is out of scope).     |

## 3. Files

**Create:**

- `src/instrumentation.ts` — server/edge `register()` → `Sentry.init`; exports `onRequestError = Sentry.captureRequestError`.
- `src/lib/sentry.ts` — shared init options (DSN, `tracesSampleRate`, `sendDefaultPii: false`, `environment`) + the PII `scrub` `beforeSend`/`beforeSendTransaction`, imported by both client + server init (DRY).
- `src/pages/_error.tsx` — `Sentry.captureUnderscoreErrorException` wrapper around `next/error`.

**Modify:**

- `src/instrumentation-client.ts` — add `Sentry.init(clientOptions)` alongside the existing `initBotId()` (they coexist) + `export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;` (Pages-Router navigation instrumentation).
- `next.config.js` — `export default withSentryConfig(withBotId(nextConfig), sentryBuildOptions)`.
- `src/components/ErrorBoundary.tsx` — `Sentry.captureException(error)` in `componentDidCatch` (currently it only renders a fallback).
- `src/pages/api/contact.ts` — `Sentry.captureException(err)` in the catch blocks that currently only `console.error` (store/email failures + the outer handler) so swallowed errors surface.
- `.env.example` — document the Sentry vars.
- `package.json` — `@sentry/nextjs` (exact-pinned).

## 4. Init configuration

**Shared (`src/lib/sentry.ts`):**

```
dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
environment: process.env.VERCEL_ENV ?? 'development',
tracesSampleRate: 1,            // low traffic; dial down if quota tightens
sendDefaultPii: false,
enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),  // no-op when DSN absent (local/CI)
beforeSend / beforeSendTransaction: scrub()
```

**`scrub()`** removes anything that could carry PII before send: `delete event.request?.data`
(request bodies — the contact route's name/email/message), `delete event.user` (IP/email),
and strips any `contact`-shaped keys from `event.extra`/`contexts`. Defence-in-depth on top of
`sendDefaultPii: false`.

**Client** (`instrumentation-client.ts`): the shared options. **Server/edge**
(`instrumentation.ts` `register()`): the shared options. `enabled` makes Sentry a no-op when the
DSN is unset, so local dev and CI never emit.

## 5. `next.config.js` — `withSentryConfig`

Wrap the existing `withBotId(nextConfig)`:

```
withSentryConfig(withBotId(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,                                   // no build-log noise
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },  // upload only when the token is present (Vercel)
  widenClientFileUpload: true,
  disableLogger: true,                            // tree-shake Sentry logger from the client bundle
})
```

With no `SENTRY_AUTH_TOKEN` (local + GitHub CI), source-map upload is disabled and the build
succeeds unchanged. On Vercel (token present), maps upload and traces become readable.

## 6. Env vars (user-side)

| Var                      | Where                              | Notes                                             |
| ------------------------ | ---------------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel Prod+Preview                | the DSN (safe to expose); enables runtime capture |
| `SENTRY_ORG`             | Vercel Prod+Preview                | org slug (source-map upload)                      |
| `SENTRY_PROJECT`         | Vercel Prod+Preview                | project slug                                      |
| `SENTRY_AUTH_TOKEN`      | Vercel Prod+Preview, **Sensitive** | source-map upload token                           |

**CI/local:** none required — builds skip upload + Sentry is a no-op without the DSN.
**User unblocker:** free Sentry account → new **Next.js** project → copy the **DSN**; create an
**auth token** (Settings → Auth Tokens, `project:releases` scope) + note the **org**/**project** slugs.

## 7. Verification

1. `npm run check` green locally with **no** Sentry env (Sentry no-op, build skips upload).
2. Set the 4 vars in Vercel → preview deploy: build log shows source-map upload; a **temporary**
   throwaway error trigger (e.g. a `?throw=1` guard or a throwaway `/api/sentry-test`) →
   confirm the event lands in Sentry with a **readable** trace + a performance transaction +
   **no PII** in the payload. Remove the trigger before merge.
3. Confirm the contact route still behaves identically (graceful success) and a forced
   store/email failure now also shows in Sentry.

## 8. Out of scope (YAGNI)

Session replay · profiling · ad-blocker tunnel route · custom-styled 500 page · alert rules
beyond Sentry's default "email on new issue" · uploading source maps from CI.

## 9. Commit breakdown (tidy-first; authored `h.goretsov`)

1. `docs:` refresh stale `BACKLOG.md` (Phases 2/3 done, Phase 4 ABANDONED, Phase 5 in progress).
2. `chore:` add `@sentry/nextjs` + `.env.example` vars.
3. `feat:` Sentry init (shared options + scrubber, client + server instrumentation) + `withSentryConfig`.
4. `feat:` capture wiring — `_error.tsx`, `ErrorBoundary`, `/api/contact` catch blocks.

## 10. Acceptance

- Errors (client + server + `/api/contact`) and performance transactions reach Sentry in
  production with readable (source-mapped) traces.
- No PII in any Sentry payload; `sendDefaultPii: false`.
- `npm run check` + GitHub CI green with no Sentry secrets present.
- Zero visual change for end users; contact route behaviour unchanged.
